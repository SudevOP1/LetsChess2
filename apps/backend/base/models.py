from django.db import models
from django.contrib.auth.models import User

import uuid

class ChessGame(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    start_time  = models.DateTimeField(auto_now_add=True)
    player1     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="game_as_player1")
    player2     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="game_as_player2")
    winner      = models.IntegerField(choices=[
        (0, "Incomplete"),
        (1, "Player 1"),
        (2, "Player 2"),
        (3, "Draw"),
    ], null=False, default=0)  # 0=incomplete, 1=player1, 2=player2, 3=draw
    moves = models.TextField(blank=True) # notations (eg: "e4 e5 Nf3 Nc6 ...")

    def __str__(self):
        return f"Game {self.id} - {self.winner} - {self.player1} vs {self.player2}"

