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

            # send all game data
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
            # validate json format
            try:
                data = json.loads(text_data)
                move = data.get(move)
                if move is None:
                    await self.send(text_data=json.dumps({
                        "error": f"missing \"move\" field"
                    }))
                    return
            except Exception as e:
                await self.send(text_data=json.dumps({
                    "error": f"invalid json format"
                }))
                return

            # check whether game exists and is active
            if self.game_obj.winner != 0:
                await self.send(text_data=json.dumps({
                    "error": f"game is over"
                }))
                await self.disconnect()

            # turn validation
            self.board

            # TODO: resign, draw offer

            # move legality

            # check gameover condition

            # save move to db

            # broadcast move
        except Exception as e:
            await self.send(text_data=json.dumps({
                "error": f"something went wrong: {str(e)}"
            }))

    async def broadcast_move(self, event):
        move = event["move"]
        await self.send(text_data=json.dumps({
            "type": "move",
            "move": move,
        }))

    @sync_to_async
    def save_move(self, move):
        print_debug(f"{move} move saved to db")

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
