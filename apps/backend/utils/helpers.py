from chess import Board  # pyrefly: ignore [missing-import]


async def get_game_metadata(
    game: dict,
    current_user: dict,
    opponent_user: dict,
) -> dict:
    player1_id = str(game.get("player1_id"))
    player2_id = str(game.get("player2_id"))
    player1, player2 = (current_user, opponent_user)
    if current_user.get("id") != player1_id:
        player1, player2 = player2, player1

    return {
        "player1_id": player1_id,
        "player2_id": player2_id,
        "player1_username": player1.get("username"),
        "player2_username": player2.get("username"),
        "player1_elo": player1.get("elo"),
        "player2_elo": player2.get("elo"),
        "started_at": game.get("created_at"),
    }


def get_game_data(board: Board, san_moves: list[str] | None = None) -> dict:

    # uci moves
    uci_moves = [move.uci() for move in board.move_stack]

    # san moves
    if san_moves is None:
        temp = Board()
        san_moves = []
        for move in board.move_stack:
            san_moves.append(temp.san(move))
            temp.push(move)

    # TODO: resignation, draw_by_agreement, timeout
    result = ""
    if board.is_checkmate():
        result = "checkmate"
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
        "is_check": board.is_check(),
        "is_game_over": board.is_game_over(),
        "turn": "w" if board.turn else "b",
        "result": result,
    }
