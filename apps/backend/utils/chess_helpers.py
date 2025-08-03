from asgiref.sync import sync_to_async

import chess

def get_board_from_moves(moves):
    try:
        board = chess.Board()
        moves = moves.split(" ")
        for move in moves:
            board.push_san(move)

        return True, board
    except Exception as e:
        return False, str(e)

@sync_to_async
def get_game_data(game_obj):
    board_ok, board = get_board_from_moves(game_obj.moves)
    if not board_ok:
        raise Exception("Could not resolve board")
    return {
        "id"            : str(game_obj.id),
        "white"         : game_obj.player1.username,
        "black"         : game_obj.player2.username,
        "start_time"    : game_obj.start_time.isoformat() if game_obj.start_time else None,
        "san_moves"     : game_obj.moves,

        "uci_moves"     : [m.uci() for m in board.move_stack],
        "status"        : board.outcome().result() if board.outcome() else "ongoing",
        "fen"           : board.fen(),
        "turn"          : "w" if board.turn == chess.WHITE else "b",
        "legal_moves"   : [m.uci() for m in board.legal_moves],
        "in_check"      : board.is_check(),
    }

