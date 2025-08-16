from asgiref.sync import sync_to_async

import chess

def get_board_from_moves(san_moves_str):
    """
    returns updated board object by playing the san_moves_str
    """
    try:
        board = chess.Board()
        san_moves = [m for m in san_moves_str.split(" ") if m.strip()]
        for san_move in san_moves:
            board.push_san(san_move)
        return True, board
    except Exception as e:
        return False, str(e)

@sync_to_async
def get_game_metadata(game_obj):
    """
    returns the data about the game_obj that doesnt change after every move
    """
    return {
        "id"            : str(game_obj.id),
        "white"         : game_obj.player1.username,
        "black"         : game_obj.player2.username,
        "start_time"    : game_obj.start_time.isoformat() if game_obj.start_time else None,
    }

@sync_to_async
def get_game_data(game_obj):
    """
    returns the data about the game_obj that may change after every move
    """
    board_ok, board = get_board_from_moves(game_obj.moves)
    if not board_ok:
        raise Exception(f"Could not resolve board: {board}")
    return {
        "san_moves"     : game_obj.moves.split(" "),
        "uci_moves"     : [m.uci() for m in board.move_stack],
        "status"        : board.outcome().result() if board.outcome() else "ongoing",
        "fen"           : board.fen(),
        "turn"          : "w" if board.turn == chess.WHITE else "b",
        "legal_moves"   : [m.uci() for m in board.legal_moves],
        "in_check"      : board.is_check(),
        "gameover"      : board.outcome().result() if board.outcome() else "ongoing",
    }

