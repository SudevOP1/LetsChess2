import chess
from typing import Callable

POS_INF = 10**7
NEG_INF = -POS_INF

piece_values = {
    chess.PAWN: 100,
    chess.KNIGHT: 300,
    chess.BISHOP: 300,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 0,
}


ENDGAME_THRESHOLD = 2400
PIECE_SQUARE_TABLES = {
    chess.PAWN: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        50,
        50,
        50,
        50,
        50,
        50,
        50,
        50,
        10,
        10,
        20,
        30,
        30,
        20,
        10,
        10,
        5,
        5,
        10,
        25,
        25,
        10,
        5,
        5,
        0,
        0,
        0,
        20,
        20,
        0,
        0,
        0,
        5,
        -5,
        -10,
        0,
        0,
        -10,
        -5,
        5,
        5,
        10,
        10,
        -20,
        -20,
        10,
        10,
        5,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ],
    chess.KNIGHT: [
        -50,
        -40,
        -30,
        -30,
        -30,
        -30,
        -40,
        -50,
        -40,
        -20,
        0,
        0,
        0,
        0,
        -20,
        -40,
        -30,
        0,
        10,
        15,
        15,
        10,
        0,
        -30,
        -30,
        5,
        15,
        20,
        20,
        15,
        5,
        -30,
        -30,
        0,
        15,
        20,
        20,
        15,
        0,
        -30,
        -30,
        5,
        10,
        15,
        15,
        10,
        5,
        -30,
        -40,
        -20,
        0,
        5,
        5,
        0,
        -20,
        -40,
        -50,
        -40,
        -30,
        -30,
        -30,
        -30,
        -40,
        -50,
    ],
    chess.BISHOP: [
        -20,
        -10,
        -10,
        -10,
        -10,
        -10,
        -10,
        -20,
        -10,
        0,
        0,
        0,
        0,
        0,
        0,
        -10,
        -10,
        0,
        5,
        10,
        10,
        5,
        0,
        -10,
        -10,
        5,
        5,
        10,
        10,
        5,
        5,
        -10,
        -10,
        0,
        10,
        10,
        10,
        10,
        0,
        -10,
        -10,
        10,
        10,
        10,
        10,
        10,
        10,
        -10,
        -10,
        5,
        0,
        0,
        0,
        0,
        5,
        -10,
        -20,
        -10,
        -10,
        -10,
        -10,
        -10,
        -10,
        -20,
    ],
    chess.ROOK: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        5,
        10,
        10,
        10,
        10,
        10,
        10,
        5,
        -5,
        0,
        0,
        0,
        0,
        0,
        0,
        -5,
        -5,
        0,
        0,
        0,
        0,
        0,
        0,
        -5,
        -5,
        0,
        0,
        0,
        0,
        0,
        0,
        -5,
        -5,
        0,
        0,
        0,
        0,
        0,
        0,
        -5,
        -5,
        0,
        0,
        0,
        0,
        0,
        0,
        -5,
        0,
        0,
        0,
        5,
        5,
        0,
        0,
        0,
    ],
    chess.QUEEN: [
        -20,
        -10,
        -10,
        -5,
        -5,
        -10,
        -10,
        -20,
        -10,
        0,
        0,
        0,
        0,
        0,
        0,
        -10,
        -10,
        0,
        5,
        5,
        5,
        5,
        0,
        -10,
        -5,
        0,
        5,
        5,
        5,
        5,
        0,
        -5,
        0,
        0,
        5,
        5,
        5,
        5,
        0,
        -5,
        -10,
        5,
        5,
        5,
        5,
        5,
        0,
        -10,
        -10,
        0,
        5,
        0,
        0,
        0,
        0,
        -10,
        -20,
        -10,
        -10,
        -5,
        -5,
        -10,
        -10,
        -20,
    ],
    chess.KING: {
        "middle game": [
            -30,
            -40,
            -40,
            -50,
            -50,
            -40,
            -40,
            -30,
            -30,
            -40,
            -40,
            -50,
            -50,
            -40,
            -40,
            -30,
            -30,
            -40,
            -40,
            -50,
            -50,
            -40,
            -40,
            -30,
            -30,
            -40,
            -40,
            -50,
            -50,
            -40,
            -40,
            -30,
            -20,
            -30,
            -30,
            -40,
            -40,
            -30,
            -30,
            -20,
            -10,
            -20,
            -20,
            -20,
            -20,
            -20,
            -20,
            -10,
            20,
            20,
            0,
            0,
            0,
            0,
            20,
            20,
            20,
            30,
            10,
            0,
            0,
            10,
            30,
            20,
        ],
        "end game": [
            -50,
            -40,
            -30,
            -20,
            -20,
            -30,
            -40,
            -50,
            -30,
            -20,
            -10,
            0,
            0,
            -10,
            -20,
            -30,
            -30,
            -10,
            20,
            30,
            30,
            20,
            -10,
            -30,
            -30,
            -10,
            30,
            40,
            40,
            30,
            -10,
            -30,
            -30,
            -10,
            30,
            40,
            40,
            30,
            -10,
            -30,
            -30,
            -10,
            20,
            30,
            30,
            20,
            -10,
            -30,
            -30,
            -30,
            0,
            0,
            0,
            0,
            -30,
            -30,
            -50,
            -30,
            -30,
            -30,
            -30,
            -30,
            -30,
            -50,
        ],
    },
}


def get_piece_value(piece: chess.Piece | int | str) -> int:

    if isinstance(piece, str):
        return piece_values[chess.Piece.from_symbol(piece).piece_type]

    if isinstance(piece, chess.Piece):
        return piece_values[piece.piece_type]

    if isinstance(piece, int) and piece in piece_values:
        return piece_values[piece]

    raise Exception(f"encountered invalid piece: {type(piece)} {piece}")


def get_ordered_moves(board: chess.Board, moves: list[chess.Move]) -> list[chess.Move]:
    """returns all legal moves sorted by their score (highest first)"""
    return sorted(moves, key=lambda m: get_move_score(board, m), reverse=True)


def get_move_score(board: chess.Board, move: chess.Move) -> int:
    """calculates a heuristic score for a move based on captures, promotions, and pawn threats to guide move ordering"""
    _move_score = 0
    _moved_piece = board.piece_at(move.from_square)
    _captured_piece = board.piece_at(move.to_square)

    if _captured_piece is not None:
        _move_score += 10 * get_piece_value(_captured_piece) - get_piece_value(
            _moved_piece
        )

    if len(move.uci()) == 5:
        _move_score += get_piece_value(move.uci()[4])

    if is_square_attacked_by_pawn(board, move.to_square):
        _move_score -= get_piece_value(_moved_piece)

    return _move_score


def is_square_attacked_by_pawn(board: chess.Board, square: chess.Square) -> bool:
    """returns True if the given square is attacked by any opposing pawn"""
    opponent_color = chess.BLACK if board.turn == chess.WHITE else chess.WHITE
    for attacker in board.attackers(opponent_color, square):
        if board.piece_type_at(attacker) == chess.PAWN:
            return True
    return False


def search_root(
    board: chess.Board, eval_func: Callable, depth: int = 3, tt: dict | None = None
) -> tuple[chess.Move, int]:
    """returns both move_obj and evaluation"""
    _best_move: chess.Move | None = None
    _best_eval = NEG_INF
    _alpha = NEG_INF
    _beta = POS_INF

    for _move in get_ordered_moves(board, list(board.legal_moves)):
        _temp_board = board.copy()
        _temp_board.push(_move)
        _eval = -search(_temp_board, eval_func, depth - 1, -_beta, -_alpha, tt)

        if _best_move is None or _best_eval < _eval:
            _best_move = _move
            _best_eval = _eval
        _alpha = max(_alpha, _eval)

    return _best_move, _best_eval


"""
key     = fen
value   = (depth, score, best_move, flag)
flag    ∈ {'EXACT', 'LOWER', 'UPPER'}

module-level default table, used when callers don't pass their own `tt`.
callers running multiple concurrent searches (e.g. several bot games at
once) should pass in their own dict so their entries/clears don't clobber
one another.
"""
transposition_table: dict[str, tuple[int, int, str, str]] = {}


def search(
    board: chess.Board,
    eval_func: Callable,
    depth: int,
    alpha: int = NEG_INF,
    beta: int = POS_INF,
    tt: dict | None = None,
) -> int:
    if tt is None:
        tt = transposition_table
    _og_alpha = alpha
    _fen = board.fen()

    if _fen in tt:
        (
            _cached_depth,
            _cached_score,
            _cached_move,
            _cached_flag,
        ) = tt[_fen]
        if _cached_depth >= depth:

            if _cached_flag == "EXACT":
                return _cached_score
            elif _cached_flag == "LOWER":
                alpha = max(alpha, _cached_score)
            elif _cached_flag == "UPPER":
                beta = min(beta, _cached_score)

            if alpha >= beta:
                return _cached_score

    if depth == 0:
        return search_all_captures(board, eval_func, alpha, beta)

    if board.is_game_over():
        if board.is_checkmate():
            return NEG_INF
        return 0

    _best_score = NEG_INF
    _best_move = None

    for _move_obj in get_ordered_moves(board, list(board.legal_moves)):
        _temp_board = board.copy()
        _temp_board.push(_move_obj)
        _eval = -search(_temp_board, eval_func, depth - 1, -beta, -alpha, tt)

        if _eval > _best_score:
            _best_score = _eval
            _best_move = _move_obj.uci()

        if _eval >= beta:
            tt[_fen] = (depth, _best_score, _best_move, "LOWER")
            return _best_score

        alpha = max(alpha, _eval)

    _flag = "UPPER" if _best_score <= _og_alpha else "EXACT"
    tt[_fen] = (depth, _best_score, _best_move, _flag)
    return _best_score


def search_all_captures(
    board: chess.Board,
    eval_func: Callable,
    alpha: int,
    beta: int,
) -> int:
    _eval = eval_func(board)
    if _eval >= beta:
        return beta
    alpha = max(alpha, _eval)

    _capture_moves = board.generate_legal_captures()
    get_ordered_moves(board, _capture_moves)

    for _capture_move in _capture_moves:
        board.push(_capture_move)
        _eval = -search_all_captures(board, -beta, -alpha)
        board.pop()

        if _eval >= beta:
            return beta
        alpha = max(alpha, _eval)

    return alpha


def calc_eval(board: chess.Board) -> int:
    _value = 0
    for _piece in piece_values.keys():
        _value += len(board.pieces(_piece, chess.WHITE)) * get_piece_value(_piece)
        _value -= len(board.pieces(_piece, chess.BLACK)) * get_piece_value(_piece)
    return _value if board.turn == chess.WHITE else -_value


def calc_active_square_eval(board: chess.Board) -> int:
    _value = 0

    _white_active_squares = 0
    _black_active_squares = 0
    for _move in board.legal_moves:
        _piece = board.piece_at(_move.from_square)
        if not _piece:
            continue
        _active_squares_bonus = get_piece_value(_piece) / 100
        if _piece.color == chess.WHITE:
            _white_active_squares += _active_squares_bonus
        else:
            _black_active_squares += _active_squares_bonus

    _value += _white_active_squares
    _value += _black_active_squares

    return _value


def calc_heu_eval(board: chess.Board) -> int:
    _value = 0

    # check for endgame
    _material_score = 0
    for _piece_type, _base_value in piece_values.items():
        if _piece_type == chess.KING:
            continue
        _material_score += _base_value * (
            len(board.pieces(_piece_type, chess.WHITE))
            + len(board.pieces(_piece_type, chess.BLACK))
        )
    _endgame = _material_score < ENDGAME_THRESHOLD

    for _piece_type, _base_value in piece_values.items():
        _table: list[int]
        if _piece_type == chess.KING:
            _table = (
                PIECE_SQUARE_TABLES[chess.KING]["end game"]
                if _endgame
                else PIECE_SQUARE_TABLES[chess.KING]["middle game"]
            )
        else:
            _table = PIECE_SQUARE_TABLES[_piece_type]

        # white
        for _square in board.pieces(_piece_type, chess.WHITE):
            _value += _table[_square]

        # black
        for _square in board.pieces(_piece_type, chess.BLACK):
            _mirrored_square = chess.square_mirror(_square)
            _value -= _table[_mirrored_square]

    return _value if board.turn == chess.WHITE else -_value
