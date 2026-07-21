import { useState, useEffect, useRef } from "react";

import Logger from "../services/logger.js";
import wp from "../assets/pieces/neo/wp.png";
import wb from "../assets/pieces/neo/wb.png";
import wn from "../assets/pieces/neo/wn.png";
import wr from "../assets/pieces/neo/wr.png";
import wq from "../assets/pieces/neo/wq.png";
import wk from "../assets/pieces/neo/wk.png";
import bp from "../assets/pieces/neo/bp.png";
import bb from "../assets/pieces/neo/bb.png";
import bn from "../assets/pieces/neo/bn.png";
import br from "../assets/pieces/neo/br.png";
import bq from "../assets/pieces/neo/bq.png";
import bk from "../assets/pieces/neo/bk.png";
import { Crown } from "lucide-react";

const pieceImgs = {
  P: wp,
  B: wb,
  N: wn,
  R: wr,
  Q: wq,
  K: wk,
  p: bp,
  b: bb,
  n: bn,
  r: br,
  q: bq,
  k: bk,
};

const getPiecePositions = (fenString = "") => {
  const positions = Array.from({ length: 8 }, () => Array(8).fill(""));

  let rankIndex = 0;
  let fileIndex = 0;

  try {
    for (let char of fenString) {
      // piece
      if (char in pieceImgs) {
        positions[rankIndex][fileIndex] = char;
        fileIndex++;
      }

      // new rank
      else if (char === "/") {
        rankIndex += 1;
        fileIndex = 0;
      }

      // empty squares
      else if (!isNaN(char) && char !== " ") {
        const emptySquares = Number(char);

        for (let i = 0; i < emptySquares; i++) {
          positions[rankIndex][fileIndex] = "";
          fileIndex++;
        }
      }

      // end
      else if (char === " ") {
        break;
      }
    }

    return positions;
  } catch (e) {
    Logger.error(`couldnt extract piecePositions from fen string: ${fenString}\nerror: ${e}`);
  }
};

const Board = ({
  fenString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  className = "",
  selfColor,
  inverted = false,
  uciMoves = [],
  legalMoves = [],
  isCheck = false,
  turn,
  makeMove,
  isGameOver = false,
  winner = null,
  isViewingHistory = false,
}) => {
  const [piecePositions, setPiecePositions] = useState(getPiecePositions(fenString));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [pieceSize, setPieceSize] = useState({ width: 0, height: 0 });

  const prevUciMovesRef = useRef(uciMoves);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    const prev = prevUciMovesRef.current;
    if (uciMoves.length === prev.length + 1) {
      setAnimationData({ uci: uciMoves[uciMoves.length - 1], reverse: false });
    } else if (uciMoves.length === prev.length - 1) {
      setAnimationData({ uci: prev[prev.length - 1], reverse: true });
    } else {
      setAnimationData(null);
    }
    prevUciMovesRef.current = uciMoves;
  }, [uciMoves.length]);

  const theme = {
    light: "bg-[#D4DFE5]",
    dark: "bg-[#7397AC]",
  };

  useEffect(() => {
    setPiecePositions(getPiecePositions(fenString));
  }, [fenString]);

  const isSelfPiece = (piece) => {
    return !isGameOver && (selfColor === "w" ? /^[A-Z]$/.test(piece) : /^[a-z]$/.test(piece));
  };

  const getBoardIndices = (square) => {
    const fileIndex = square.charCodeAt(0) - 97;
    const rankIndex = 8 - Number(square[1]);

    return {
      rankIndex,
      fileIndex,
    };
  };

  const getUciSquare = (rankIndex, fileIndex) => {
    const file = String.fromCharCode(97 + fileIndex);
    const rank = 8 - rankIndex;

    return `${file}${rank}`;
  };

  const getUciMoveNotation = (fromRankIndex, fromFileIndex, toRankIndex, toFileIndex) => {
    const fromSquare = getUciSquare(fromRankIndex, fromFileIndex);
    const toSquare = getUciSquare(toRankIndex, toFileIndex);

    return `${fromSquare}${toSquare}`;
  };

  const handleMove = async (uciMove) => {
    if (legalMoves.includes(uciMove)) {
      const { rankIndex: fromRankIndex, fileIndex: fromFileIndex } = getBoardIndices(uciMove.slice(0, 2));
      const { rankIndex: toRankIndex, fileIndex: toFileIndex } = getBoardIndices(uciMove.slice(2, 4));

      // send move to backend
      await makeMove(uciMove);

      // handle ui
      let newPiecePositions = piecePositions.map((row) => [...row]);
      newPiecePositions[toRankIndex][toFileIndex] = newPiecePositions[fromRankIndex][fromFileIndex];
      newPiecePositions[fromRankIndex][fromFileIndex] = "";
      setPiecePositions(newPiecePositions);

      // reset selection
      setSelectedPiece(null);
      setDraggingPiece(null);
    }
  };

  const isLegalMove = (toRankIndex, toFileIndex) => {
    // if no selected piece, return
    if (selectedPiece === null) {
      return false;
    }

    const uciMove = getUciMoveNotation(selectedPiece.fromRankIndex, selectedPiece.fromFileIndex, toRankIndex, toFileIndex);
    return legalMoves.includes(uciMove);
  };

  const handlePointerDown = (e, fromRankIndex, fromFileIndex) => {
    e.preventDefault();
    e.stopPropagation();

    // only left click or touch
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }

    const piece = piecePositions[fromRankIndex][fromFileIndex];

    // if no piece at given position, return
    if (piecePositions[fromRankIndex][fromFileIndex] === "") {
      return;
    }

    // if not self piece, return
    if (!isSelfPiece(piece)) {
      return;
    }

    setSelectedPiece({ piece, fromRankIndex, fromFileIndex });
    setDraggingPiece({ piece, fromRankIndex, fromFileIndex });
    setDragPos({ x: e.clientX, y: e.clientY });
    if (e.target) {
      setPieceSize({ width: e.target.clientWidth, height: e.target.clientHeight });
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!draggingPiece) {
      return;
    }
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e) => {
    if (!draggingPiece) {
      return;
    }

    const target = document.elementFromPoint(e.clientX, e.clientY);
    const square = target?.closest('[data-square="true"]');

    if (square) {
      const toRankIndex = parseInt(square.getAttribute("data-rank"));
      const toFileIndex = parseInt(square.getAttribute("data-file"));

      if (toRankIndex !== draggingPiece.fromRankIndex || toFileIndex !== draggingPiece.fromFileIndex) {
        const uciMove = getUciMoveNotation(draggingPiece.fromRankIndex, draggingPiece.fromFileIndex, toRankIndex, toFileIndex);
        handleMove(uciMove);
      }
    }

    setDraggingPiece(null);
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const handleClickAt = (rankIndex, fileIndex) => {
    const piece = piecePositions[rankIndex][fileIndex];

    // select piece if no piece selected
    if (selectedPiece === null) {
      // if no piece at given position, return
      if (piece === "") {
        return;
      }

      // if not self piece, return
      if (!isSelfPiece(piece)) {
        return;
      }

      // select piece
      setSelectedPiece({ piece: piece, fromRankIndex: rankIndex, fromFileIndex: fileIndex });
      return;
    }

    // if a piece is selected, check if clicked square is legal move
    if (isLegalMove(rankIndex, fileIndex)) {
      const uciMove = getUciMoveNotation(selectedPiece.fromRankIndex, selectedPiece.fromFileIndex, rankIndex, fileIndex);
      handleMove(uciMove);
      return;
    }

    // if clicked square is not a legal move, but is one of our own pieces, select it instead
    if (piece !== "" && isSelfPiece(piece)) {
      setSelectedPiece({ piece: piece, fromRankIndex: rankIndex, fromFileIndex: fileIndex });
      return;
    }

    // otherwise, clear selection
    setDraggingPiece(null);
    setSelectedPiece(null);
  };

  const isWhiteKingInCheck = () => {
    return isCheck && turn === "w";
  };

  const isBlackKingInCheck = () => {
    return isCheck && turn === "b";
  };

  const lastMove = uciMoves.length > 0 ? uciMoves[uciMoves.length - 1] : null;
  let animateCoords = null;
  if (animationData) {
    const fromIndices = getBoardIndices(animationData.uci.slice(0, 2));
    const toIndices = getBoardIndices(animationData.uci.slice(2, 4));
    animateCoords = { from: fromIndices, to: toIndices, reverse: animationData.reverse };
  }
  const sign = inverted ? -1 : 1;

  return (
    <div
      className={`flex items-center justify-center w-full h-full
        ${inverted ? "flex-col-reverse" : "flex-col"}
        ${className} ${draggingPiece ? "cursor-grabbing" : ""}
      `}
    >
      {piecePositions.map((rank, rankIndex) => (
        <div
          key={rankIndex}
          className={`flex items-center justify-center h-full w-full max-w-[calc(min(8vw, 64vh))] lg:max-w-none
            ${inverted ? "flex-row-reverse" : "flex-row"}
          `}
        >
          {rank.map((pieceCharacter, fileIndex) => (
            <div
              key={fileIndex}
              data-square="true"
              data-rank={rankIndex}
              data-file={fileIndex}
              className={`flex items-center justify-center w-full h-full max-h-[calc(min(64vw, 8vh))] lg:max-h-none relative group
                ${
                  (pieceCharacter === "K" && isWhiteKingInCheck()) || (pieceCharacter === "k" && isBlackKingInCheck())
                    ? "bg-red-500"
                    : (rankIndex + fileIndex) % 2 === 0
                      ? theme.light
                      : theme.dark
                }
              `}
              onClick={() => handleClickAt(rankIndex, fileIndex)}
            >
              <>
                {/* previous move */}
                {uciMoves.length > 0 && uciMoves[uciMoves.length - 1].includes(getUciSquare(rankIndex, fileIndex)) && (
                  <div className="absolute top-0 left-0 z-10 w-full h-full border-4 border-yellow-400" />
                )}

                {/* legal move with selected piece */}
                {isLegalMove(rankIndex, fileIndex) && (
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-10
                      ${
                        pieceCharacter !== ""
                          ? "border-7 border-red-500/80 w-3/4 h-3/4 group-hover:border-red-500 group-hover:shadow-[0px_0px_10px_0px_rgba(255,_0,_0,_0.5)]"
                          : "bg-white/60 w-1/3 h-1/3 group-hover:bg-white"
                      }
                    `}
                  />
                )}

                {/* piece image */}
                {pieceCharacter !== "" &&
                  (() => {
                    const isDestination =
                      animateCoords && animateCoords.to.rankIndex === rankIndex && animateCoords.to.fileIndex === fileIndex;
                    const isOrigin =
                      animateCoords && animateCoords.from.rankIndex === rankIndex && animateCoords.from.fileIndex === fileIndex;

                    const shouldAnimate =
                      (animateCoords &&
                        !animateCoords.reverse &&
                        isDestination &&
                        (isViewingHistory || !isSelfPiece(pieceCharacter))) ||
                      (animateCoords && animateCoords.reverse && isOrigin);

                    const animateStartX = animateCoords?.reverse ? animateCoords.to.fileIndex : animateCoords?.from.fileIndex;
                    const animateStartY = animateCoords?.reverse ? animateCoords.to.rankIndex : animateCoords?.from.rankIndex;
                    const animateEndX = animateCoords?.reverse ? animateCoords.from.fileIndex : animateCoords?.to.fileIndex;
                    const animateEndY = animateCoords?.reverse ? animateCoords.from.rankIndex : animateCoords?.to.rankIndex;

                    const xOffset = shouldAnimate ? (animateStartX - animateEndX) * sign * 100 : 0;
                    const yOffset = shouldAnimate ? (animateStartY - animateEndY) * sign * 100 : 0;

                    return (
                      <img
                        key={pieceCharacter}
                        src={pieceImgs[pieceCharacter]}
                        alt={pieceCharacter}
                        className={`w-full h-full object-contain z-20
                        ${isSelfPiece(pieceCharacter) && !isLegalMove(rankIndex, fileIndex) ? "cursor-grab active:cursor-grabbing touch-none" : ""}
                        ${draggingPiece && draggingPiece.fromRankIndex === rankIndex && draggingPiece.fromFileIndex === fileIndex ? "opacity-50" : ""}
                        ${isLegalMove(rankIndex, fileIndex) && "pointer-events-none"}
                        ${shouldAnimate ? "animate-move" : ""}
                      `}
                        style={
                          shouldAnimate
                            ? {
                                "--start-x": `${xOffset}%`,
                                "--start-y": `${yOffset}%`,
                              }
                            : {}
                        }
                        draggable={false}
                        onPointerDown={(e) => handlePointerDown(e, rankIndex, fileIndex)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                      />
                    );
                  })()}

                {/* crown icon above winner king */}
                {isGameOver && ((winner === "w" && pieceCharacter === "K") || (winner === "b" && pieceCharacter === "k")) && (
                  <div className="absolute top-0 right-0 translate-x-3 -translate-y-3 rounded-full bg-green-500 w-6 h-6 flex items-center justify-center z-20">
                    <Crown className="text-transparent w-5 h-5 translate-y-[1px]" fill="white" />
                  </div>
                )}
              </>
            </div>
          ))}
        </div>
      ))}

      {/* dragging piece */}
      {draggingPiece && (
        <img
          src={pieceImgs[draggingPiece.piece]}
          alt="dragging"
          className="fixed pointer-events-none z-50 cursor-grabbing"
          style={{
            width: pieceSize.width,
            height: pieceSize.height,
            top: dragPos.y,
            left: dragPos.x,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
};

export default Board;
