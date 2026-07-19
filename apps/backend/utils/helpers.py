from chess import Board  # pyrefly: ignore [missing-import]

from bson import ObjectId
from utils.db import db


async def get_game_metadata(game: dict) -> dict:
    player1_id = str(game.get("player1_id"))
    player2_id = str(game.get("player2_id"))

    player1 = await db.users.find_one({"_id": ObjectId(player1_id)})
    player2 = await db.users.find_one({"_id": ObjectId(player2_id)})

    return {
        "player1_id": player1_id,
        "player2_id": player2_id,
        "player1_username": player1.get("username") if player1 else None,
        "player2_username": player2.get("username") if player2 else None,
        "player1_elo": player1.get("elo") if player1 else None,
        "player2_elo": player2.get("elo") if player2 else None,
        "started_at": game.get("created_at").isoformat(),
    }


def get_game_data(board: Board, game: dict | None = None) -> dict:

    # uci moves
    uci_moves = [move.uci() for move in board.move_stack]

    # san moves
    san_moves = game.get("moves", "").split()
    if san_moves == "":
        temp = Board()
        san_moves = []
        for move in board.move_stack:
            san_moves.append(temp.san(move))
            temp.push(move)

    # result
    result = game.get("result", None)
    winner = game.get("winner", None)
    if result is None:
        if board.is_checkmate():
            result = "checkmate"
            winner = "b" if board.turn else "w"
        elif board.is_stalemate():
            result = "stalemate"
        elif board.is_insufficient_material():
            result = "insufficient_material"
        elif board.is_seventyfive_moves():
            result = "seventyfive_moves"
        elif board.is_fivefold_repetition():
            result = "fivefold_repetition"

    return {
        "fen": board.fen(),
        "san_moves": san_moves,
        "uci_moves": uci_moves,
        "legal_moves": [move.uci() for move in board.legal_moves],
        "is_check": board.is_check(),
        "is_game_over": board.is_game_over()
        or (game is not None and game.get("status") == "gameover"),
        "turn": "w" if board.turn else "b",
        "result": result,
        "winner": winner,
    }


def get_new_elo(
    elo_w: int,
    elo_b: int,
    result: str,
    winner: str | None = None,
) -> tuple[int, int]:

    K = 32

    # calculate expected scores
    exp_w = 1 / (1 + 10 ** ((elo_b - elo_w) / 400))
    exp_b = 1 / (1 + 10 ** ((elo_w - elo_b) / 400))

    # winner loser scenario
    if result in ["checkmate", "resignation"]:
        if winner == "w":
            s_a = 1
            s_b = 0
        else:
            s_a = 0
            s_b = 1

    # draw
    elif result in [
        "stalemate",
        "insufficient_material",
        "seventyfive_moves",
        "fivefold_repetition",
        "fifty_moves",
        "threefold_repetition",
    ]:
        s_a = 0.5
        s_b = 0.5

    # invalid result
    else:
        raise ValueError(f"Invalid result: {result}")

    # calculate new elo
    new_elo_w = elo_w + K * (s_a - exp_w)
    new_elo_b = elo_b + K * (s_b - exp_b)

    return int(round(new_elo_w)), int(round(new_elo_b))
