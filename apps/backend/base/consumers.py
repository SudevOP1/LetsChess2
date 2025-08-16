from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from urllib.parse import parse_qs

from .models import ChessGame
from utils.helpers import *
import json, uuid

class LiveGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = None
        try:
            # get game_id, user and access_token
            await self.accept()
            game_id       = self.scope["url_route"]["kwargs"]["game_id"]
            query_params  = parse_qs(self.scope["query_string"].decode())
            access_token  = query_params.get("access_token", [None])[0]
            user_ok, user = await get_user_from_access_token(access_token)

            # validate access token
            if not user_ok:
                await self.send(text_data=json.dumps({
                    "error": user,
                }))
                await self.close()
                return
            
            # validate game_id
            try:
                game_uuid = uuid.UUID(game_id)
                self.game_obj = await sync_to_async(ChessGame.objects.get)(id=game_uuid)
            except ValueError:
                await self.send(text_data=json.dumps({
                    "error": f"invalid game_id format: {game_id}",
                }))
                await self.close()
                return
            except Exception as e:
                await self.send(text_data=json.dumps({
                    "error": f"game not found: {game_id}",
                }))
                await self.close()
                return
            
            # check whether user is a participant
            is_participant = await check_user_participation(user, self.game_obj)
            if not is_participant:
                await self.send(text_data=json.dumps({
                    "error": f"not a game participant",
                }))
                await self.close()
                return

            # user authentication successful, join room
            self.user = user
            self.color = "w" if (self.game_obj.player1 == self.user) else "b"
            self.room_group_name = f"game_{game_id}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # send game metadata (data that doesnt change after every move, eg: id, start_time)
            await self.send(text_data=json.dumps({
                "type": "game_metadata",
                "game_metadata": await get_game_metadata(self.game_obj)
            }))

            # send game data (data that changes after every move, eg: turn, fen)
            await self.send(text_data=json.dumps({
                "type": "game_data",
                "game_data": await get_game_data(self.game_obj)
            }))

        except Exception as e:
            await self.send(text_data=json.dumps({
                "error": f"something went wrong: {str(e)}",
            }))
            await self.close()

    async def receive(self, text_data):
        try:
            # TODO: resign, draw by agreement, time

            # validate json format
            try:
                data = json.loads(text_data)
                move_uci = data.get("move")
                if move_uci is None:
                    await self.send(text_data=json.dumps({
                        "error": f"missing \"move\" field"
                    }))
                    return
            except json.JSONDecodeError as e:
                await self.send(text_data=json.dumps({
                    "error": f"invalid json format"
                }))
                return

            # get board
            await sync_to_async(self.game_obj.refresh_from_db)()
            board_ok, board = get_board_from_moves(self.game_obj.moves)
            if not board_ok:
                await self.send(text_data=json.dumps({
                    "error": f"invalid board state encountered: {board}"
                }))
                return

            # check whether game exists and is active
            game_outcome = board.outcome()
            if game_outcome:
                await self.send(text_data=json.dumps({
                    "error": f"game is over"
                }))
                await self.disconnect()
                return

            # turn validation
            color_to_move = "w" if board.turn == chess.WHITE else "b"
            if color_to_move != self.color:
                await self.send(text_data=json.dumps({
                    "error": f"not your move"
                }))
                return

            # move legality
            move_obj = chess.Move.from_uci(move_uci)
            if move_obj not in board.legal_moves:
                await self.send(text_data=json.dumps({
                    "error": f"not a legal move"
                }))
                return

            # make move and save to db
            move_san = board.san(move_obj)
            board.push(move_obj)
            self.game_obj.moves += f"{' ' if len(self.game_obj.moves) > 0 else ''}{move_san}"
            await sync_to_async(self.game_obj.save)()

            # broadcast game_data
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "broadcast_game_data",
                    "game_data": await get_game_data(self.game_obj),
                }
            )
            
        except Exception as e:
            await self.send(text_data=json.dumps({
                "error": f"something went wrong: {str(e)}"
            }))

    async def broadcast_game_data(self, event):
        game_data = event["game_data"]
        await self.send(text_data=json.dumps({
            "type": "game_data",
            "game_data": game_data,
        }))

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

class MatchMaking(AsyncWebsocketConsumer):
    async def connect(self):
        pass
