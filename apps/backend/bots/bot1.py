import chess

from .common import *


def bot1_predict(board: chess.Board, depth: int = 4, tt: dict | None = None) -> str:
    if tt is None:
        tt = transposition_table

    _best_move, _ = search_root(board, bot1_eval, depth, tt)

    if board.is_irreversible(_best_move):
        tt.clear()

    return _best_move.uci()


def bot1_eval(board: chess.Board) -> int:
    _value = 0
    _value += calc_eval(board)
    _value += calc_active_square_eval(board)
    _value += calc_heu_eval(board)
    return _value
