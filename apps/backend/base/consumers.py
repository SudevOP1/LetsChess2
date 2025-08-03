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
            game_id  = self.scope["url_route"]["kwargs"]["game_id"]
            query_params  = parse_qs(self.scope["query_string"].decode())
            access_token  = query_params.get("access_token", [None])[0]
            user_ok, user = await get_user_from_access_token(access_token)

            # invalid access token
            if not user_ok:
                await self.send(text_data=json.dumps({
                    "error": user,
                }))
                await self.close()
                return
            
            # invalid game_id
            try:
                game_uuid = uuid.UUID(game_id)
                game_obj = await sync_to_async(ChessGame.objects.get)(id=game_uuid)
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
            
            # user not participant of game
            is_participant = await check_user_participation(user, game_obj)
            if not is_participant:
                await self.send(text_data=json.dumps({
                    "error": f"not a game participant",
                }))
                await self.close()
                return

            # user authentication successful, join room
            self.room_group_name = f"game_{game_id}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # send all game data
            await self.send(text_data=json.dumps({
                "type": "game_data",
                "game_data": await get_game_data(game_obj)
            }))

        except Exception as e:
            await self.send(text_data=json.dumps({
                "error": f"something went wrong: {str(e)}",
            }))
            await self.close()
            return

    async def receive(self, text_data):
        data = json.loads(text_data)
        move = data["move"]

        # validate move
        print_debug(f"{move} move validated")

        # broadcast the move to both players
        await self.channel_layer.group_send(self.room_group_name, {
            "type": "broadcast_move",
            "move": move,
        })
        
        # save the move to db
        await self.save_move(move)

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
