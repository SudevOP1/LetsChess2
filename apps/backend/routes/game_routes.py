from datetime import datetime
from fastapi import HTTPException, APIRouter, WebSocket, WebSocketDisconnect
from bson import ObjectId
import traceback
import asyncio

from utils.auth import get_current_user_from_token
from utils.db import db
from utils import debug

game_router = APIRouter()
max_search_range = 1000
search_interval = 1.0  # second


@game_router.websocket("/find")
async def find_game(websocket: WebSocket):
    await websocket.accept()

    current_user = None
    matchmaking_id = None
    started_at = None

    incoming_messages = asyncio.Queue()
    cancel_event = asyncio.Event()

    def calculate_search_range():
        elapsed_seconds = int((datetime.utcnow() - started_at).total_seconds())
        return min(30 * (2**elapsed_seconds), max_search_range)

    async def receiver():
        try:
            while True:
                message = await websocket.receive_json()
                await incoming_messages.put(message)

        except WebSocketDisconnect:
            cancel_event.set()

        except Exception:
            cancel_event.set()

    async def authenticate_player():
        while not cancel_event.is_set():
            data = await incoming_messages.get()

            # cancelled before authentication
            if data.get("type") == "cancel":
                cancel_event.set()
                return None

            # invalid message type
            if data.get("type") != "access_token":
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "access token required",
                    }
                )
                continue

            token = data.get("access_token")

            # no token provided
            if not token:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "no token provided",
                    }
                )
                continue

            try:
                user_ok, user = await get_current_user_from_token(token)

                # auth error
                if not user_ok:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "error": user,
                        }
                    )
                    continue

                return user

            except HTTPException as e:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": e.detail,
                    }
                )
                continue

        return None

    async def add_to_matchmaking():
        result = await db.matchmaking.insert_one(
            {
                "user_id": ObjectId(current_user.get("id")),
                "elo": int(current_user.get("elo")),
                "joined_at": datetime.utcnow(),
            }
        )

        return str(result.inserted_id)

    async def find_opponent():
        range_to_search = calculate_search_range()

        return await db.matchmaking.find_one_and_update(
            {
                "elo": {
                    "$gte": int(current_user.get("elo")) - range_to_search,
                    "$lte": int(current_user.get("elo")) + range_to_search,
                },
                "_id": {"$ne": ObjectId(matchmaking_id)},
                "matched": {"$ne": True},
            },
            {"$set": {"matched": True}},
        )

    async def create_game(player1_id, player2_id):
        game = await db.games.insert_one(
            {
                "created_at": datetime.utcnow(),
                "player1_id": ObjectId(player1_id),
                "player2_id": ObjectId(player2_id),
                "status": "active",
                "moves": "",
            }
        )

        return str(game.inserted_id)

    async def remove_from_matchmaking(entry_id):
        if entry_id:
            await db.matchmaking.delete_one({"_id": ObjectId(entry_id)})

    receiver_task = asyncio.create_task(receiver())

    try:
        # authenticate user
        current_user = await authenticate_player()
        if current_user is None:
            return

        # add user to matchmaking queue
        matchmaking_id = await add_to_matchmaking()
        started_at = datetime.utcnow()
        await websocket.send_json({"type": "waiting"})

        while not cancel_event.is_set():
            # listen for cancel message
            try:
                while True:
                    data = incoming_messages.get_nowait()

                    if data.get("type") == "cancel":
                        cancel_event.set()
                        break

            except asyncio.QueueEmpty:
                pass

            # cancel matchmaking
            if cancel_event.is_set():
                break

            # check if current user has matched by someone else
            current_entry = await db.matchmaking.find_one(
                {"_id": ObjectId(matchmaking_id)}
            )
            if current_entry and current_entry.get("game_id"):
                await remove_from_matchmaking(matchmaking_id)
                await websocket.send_json(
                    {
                        "type": "found",
                        "game_id": current_entry["game_id"],
                    }
                )
                return
            elif current_entry and current_entry.get("matched"):
                # someone is creating a game with current user, wait for it
                pass
            else:
                # find opponent
                opponent = await find_opponent()
                if opponent:
                    game_id = await create_game(
                        player1_id=opponent["user_id"],
                        player2_id=current_user["id"],
                    )

                    await db.matchmaking.update_one(
                        {"_id": opponent["_id"]}, {"$set": {"game_id": game_id}}
                    )

                    await remove_from_matchmaking(matchmaking_id)

                    await websocket.send_json(
                        {
                            "type": "found",
                            "game_id": game_id,
                        }
                    )

                    return

            try:
                await asyncio.wait_for(
                    cancel_event.wait(),
                    timeout=search_interval,
                )

            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        pass

    except Exception:
        debug.error(
            "500 WS /game/find",
            traceback.format_exc(),
            api_route=True,
        )

        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "error": "something went wrong",
                }
            )
        except Exception:
            pass

    finally:
        receiver_task.cancel()

        try:
            await receiver_task
        except asyncio.CancelledError:
            pass

        await remove_from_matchmaking(matchmaking_id)

        try:
            await websocket.close()
        except Exception:
            pass
