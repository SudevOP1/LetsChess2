import { useState } from "react";
import { useMyContext } from "../context/MyContext.jsx";

const ChessBoard = ({ classNames, board, legalMoves, trySendingUciMove }) => {

  let getEmptyArray = (fillWith = "") => {
    return Array.from({ length: 8 }, () => Array(8).fill(fillWith));
  };

  let { theme } = useMyContext();
  let [heldPiece, setHeldPiece] = useState(null);
  let [highlightedSquares, setHighlightedSquares] = useState(
    getEmptyArray(false)
  );

  let getSquareNotation = (rankIndex, fileIndex) => {
    return String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
  };

  let getArrayNotation = (notation) => {
    return {
      file: notation[0].charCodeAt(0) - 97,
      rank: 8 - parseInt(notation[1]),
    };
  };

  let holdThisPiece = (e, rankIndex, fileIndex) => {
    let piece = board[rankIndex][fileIndex];
    if (piece === " ") return;
    // e.preventDefault();

    let fromSq = getSquareNotation(rankIndex, fileIndex);
    let availableSquares = legalMoves.filter(
      (move) => move.slice(0, 2) === fromSq
    );

    setHeldPiece({
      fromSqNotation: fromSq,
      toSqNotations: availableSquares.map((sq) => sq.slice(2, 4)),
    });

    let newHighlightesSquares = highlightedSquares.map((row) => [...row]);
    for (let sq of availableSquares) {
      let { rank: r, file: f } = getArrayNotation(sq.slice(2, 4));
      newHighlightesSquares[r][f] = true;
    }
    setHighlightedSquares(newHighlightesSquares);
  };

  let dropThisPiece = (e, toRankIndex, toFileIndex) => {
    // e.preventDefault();
    let toSq = getSquareNotation(toRankIndex, toFileIndex);
    let { fromSqNotation: fromSqNotation, toSqNotations: toSqNotations } =
      heldPiece;

    if (toSqNotations.includes(toSq)) {
      trySendingUciMove(fromSqNotation + toSq);
      setHighlightedSquares(getEmptyArray(false));
      setHeldPiece(null);
      return;
    }
    setHighlightedSquares(getEmptyArray(false));
    setHeldPiece(null);
  };

  let allowDrop = (e) => e.preventDefault();

  return (
    <div className={`flex flex-col h-full ${classNames}`}>
      {board.map((row, rankIndex) => (
        <div key={rankIndex} className="flex flex-row flex-1">
          {row.map((col, fileIndex) => (
            <div
              key={fileIndex}
              onDragOver={allowDrop}
              onDrop={(e) => dropThisPiece(e, rankIndex, fileIndex)}
              className={`flex items-center justify-center flex-1 aspect-square relative ${
                (rankIndex + fileIndex) % 2 === 0
                  ? theme.board.light
                  : theme.board.dark
              }`}
            >
              {highlightedSquares[rankIndex][fileIndex] &&
                (board[rankIndex][fileIndex] === " " ? (
                  // highlighted and empty square
                  <div
                    className={`absolute w-1/3 h-1/3 left-1/2 top-1/2 rounded-full
                    -translate-x-1/2 -translate-y-1/2 ${theme.board.availableEmptySquare}`}
                  />
                ) : (
                  // highlighted and not an empty square
                  <div
                    className={`absolute w-3/4 h-3/4 left-1/2 top-1/2 rounded-full
                    -translate-x-1/2 -translate-y-1/2 border-6 ${theme.board.availableNonEmptySquare}`}
                  />
                ))}
              {col !== " " && (
                <img
                  src={theme.pieces[col]}
                  className={`object-contain absolute left-1/2 top-1/2 -translate-x-1/2
                  -translate-y-1/2 transition duration-200 ${
                    heldPiece ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  onDragStart={(e) => holdThisPiece(e, rankIndex, fileIndex)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
