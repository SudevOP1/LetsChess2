from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from .models import ChessGame
import json

class LiveGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.room_group_name = f"game_{self.game_id}"

        # join room
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def receive(self, text_data):
        data = json.loads(text_data)
        move = data["move"]

        # broadcast the move to both players
        await self.channel_layer.group_send(self.room_group_name, {
            "type": "broadcast_move",
            "move": move,
        })
        
        # also save the move to db
        await self.save_move(move)

    async def broadcast_msg(self, event):
        move = event["move"]
        await self.send(text_data=json.dumps({
            "type": "move",
            "move": move,
        }))

    @sync_to_async
    def save_move(self, move):
        game = ChessGame.objects.get(id=self.game_id)
        game.moves.append(f" {move}")
        game.save()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        game = ChessGame.objects.get(id=self.game_id)
        game.save()
