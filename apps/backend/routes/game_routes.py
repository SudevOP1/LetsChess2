from typing import Optional
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from bson import ObjectId
from chess import Board, Move  # pyrefly: ignore [missing-import]
import traceback
import asyncio

from utils.auth import authenticate_websocket_user
from utils.db import db
from utils.helpers import get_game_data, get_game_metadata
from utils import debug

game_router = APIRouter()

# matchmaking
max_search_range = 1000
search_interval = 1.0  # second

# active game websocket connections
connections: dict[str : dict[str:WebSocket]] = {
    #     game_id: {
    #         player1_id: websocket1,
    #         player2_id: websocket2,
    #     }
}


@game_router.websocket("/find")
async def find_game(websocket: WebSocket):
    await websocket.accept()

    current_user = None
    matchmaking_id = None
    started_at = None

    incoming_messages = asyncio.Queue()
    cancel_event = asyncio.Event()

    def calculate_search_range() -> int:
        elapsed_seconds = int((datetime.utcnow() - started_at).total_seconds())
        return min(30 * (2**elapsed_seconds), max_search_range)

    async def receiver() -> None:
        try:
            while True:
                message = await websocket.receive_json()
                await incoming_messages.put(message)

        except WebSocketDisconnect:
            cancel_event.set()

        except Exception:
            cancel_event.set()

    async def add_to_matchmaking() -> str:
        result = await db.matchmaking.insert_one(
            {
                "user_id": ObjectId(current_user.get("id")),
                "elo": int(current_user.get("elo")),
                "joined_at": datetime.utcnow(),
            }
        )

        return str(result.inserted_id)

    async def find_opponent() -> Optional[dict]:
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

    async def create_game(player1_id: str, player2_id: str) -> str:
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

    async def remove_from_matchmaking(matchmaking_id: str) -> None:
        if matchmaking_id:
            await db.matchmaking.delete_one({"_id": ObjectId(matchmaking_id)})

    receiver_task = asyncio.create_task(receiver())

    try:
        # authenticate user
        current_user = await authenticate_websocket_user(incoming_messages, websocket)
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


@game_router.websocket("/{game_id}")
async def play_game(websocket: WebSocket, game_id: str):
    await websocket.accept()

    current_user = None
    opponent_user = None
    incoming_messages = asyncio.Queue()
    game = None  # local copy
    board = Board()

    async def send_to_player(msg: dict) -> None:
        await websocket.send_json(msg)

    async def send_to_opponent(msg: dict) -> None:
        try:
            if opponent_user is None:
                return
            opponent_websocket = connections.get(game_id, {}).get(
                opponent_user.get("id"), None
            )
            if opponent_websocket is not None:
                await opponent_websocket.send_json(msg)
        except Exception:
            pass

    async def broadcast(msg: dict) -> None:
        await send_to_player(msg)
        await send_to_opponent(msg)

    async def handle_message(msg: dict) -> None:

        match msg.get("type", ""):
            case "request_metadata":
                game_metadata = await get_game_metadata(
                    game, current_user, opponent_user
                )
                await send_to_player(
                    {
                        "type": "metadata",
                        "metadata": game_metadata,
                    }
                )

            case "request_data":
                await send_to_player(
                    {
                        "type": "data",
                        "data": get_game_data(board, game.get("moves", "").split()),
                    }
                )

            case "move":
                if game.get("status") != "active":
                    await send_to_player({"type": "error", "error": "game is inactive"})
                    return

                if current_user.get("id") not in [
                    str(game.get("player1_id")),
                    str(game.get("player2_id")),
                ]:
                    await send_to_player({"type": "error", "error": "not your game"})
                    return

                await handle_uci_move(msg.get("move", ""))

            case _:
                await send_to_player({"type": "invalid_message"})

    async def handle_uci_move(uci_move: str) -> None:

        # check turn
        turn = "w" if board.turn else "b"
        current_user_color = (
            "w" if str(game.get("player1_id")) == current_user.get("id") else "b"
        )
        if turn != current_user_color:
            await send_to_player({"type": "error", "error": "not your turn"})
            return

        try:
            move = Move.from_uci(uci_move)
        except Exception:
            await send_to_player({"type": "error", "error": "invalid move"})
            return

        # illegal move
        if move not in board.legal_moves:
            await send_to_player({"type": "error", "error": "illegal move"})
            return

        # make move
        san_move = board.san(move)
        board.push(move)
        san_moves = (game.get("moves", "") + " " + san_move).strip()

        # update game
        game["moves"] = san_moves
        await db.games.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": {"moves": san_moves}},
        )

        # broadcast move
        await broadcast(
            {
                "type": "move",
                "move": uci_move,
                **get_game_data(board, game.get("moves", "").split()),
            }
        )

        # check if game is over
        if board.is_game_over():
            await handle_game_over()
            return

    async def handle_game_over():

        # set game data
        game_data = get_game_data(board, game.get("moves", "").split())
        result = game_data.get("result")

        # update game
        game["status"] = "gameover"
        game["result"] = result
        await db.games.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": {"status": "gameover", "result": result}},
        )

        # TODO: update users' elo

        # broadcast gameover
        await broadcast({"type": "game_over", **game_data})

        return

    try:
        # check if game exists
        game = await db.games.find_one({"_id": ObjectId(game_id)})
        if not game:
            await websocket.send_json({"type": "error", "error": "game not found"})
            return

        # load board
        for move in game.get("moves", "").split():
            board.push_san(move)

        # authenticate user
        current_user = await authenticate_websocket_user(incoming_messages, websocket)
        if current_user is None:
            return

        # get opponent
        opponent_user_id = str(
            game.get("player1_id")
            if current_user.get("id") == game.get("player2_id")
            else game.get("player2_id")
        )
        opponent_user = await db.users.find_one({"_id": ObjectId(opponent_user_id)})
        opponent_user["id"] = opponent_user_id
        del opponent_user["_id"]

        # send metadata and data
        game_metadata = await get_game_metadata(game, current_user, opponent_user)
        game_data = get_game_data(board, game.get("moves", "").split())
        await send_to_player({"type": "metadata", "metadata": game_metadata})
        await send_to_player({"type": "data", "data": game_data})

        # if game is already over, send the result and return
        if game.get("status") == "gameover":
            return

        # add user to active connections
        if game_id not in connections.keys():
            connections[game_id] = {}
        connections[game_id][current_user.get("id")] = websocket

        while True:
            msg = await incoming_messages.get()
            await handle_message(msg)

    except WebSocketDisconnect:
        pass

    except Exception:
        debug.error(
            f"500 WS /game/{game_id}",
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
        # cleanup
        if game_id in connections:
            if current_user:
                connections[game_id].pop(current_user["id"], None)
            if not connections[game_id]:
                del connections[game_id]
