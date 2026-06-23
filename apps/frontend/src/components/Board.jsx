import { useState, useEffect } from "react";

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
    console.error(`couldnt extract piecePositions from fen string: ${fenString}\nerror: ${e}`);
  }
};

const getTurn = (fenString = "") => {
  try {
    const turn = fenString.split(" ")[1];
    if (!turn || !(turn === "w" || turn === "b")) {
      throw new Error("turn not found in fen string");
    }
    return turn;
  } catch (e) {
    console.error(`couldnt extract turn from fen string: ${fenString}\nerror: ${e}`);
  }
};

const Board = ({ fenString = "", className = "", inverted = false }) => {
  const [piecePositions, setPiecePositions] = useState(getPiecePositions(fenString));
  const [turn, setTurn] = useState(getTurn(fenString));

  const theme = {
    light: "bg-[#D4DFE5]",
    dark: "bg-[#7397AC]",
  };

  useEffect(() => {
    setPiecePositions(getPiecePositions(fenString));
  }, [fenString]);

  return (
    <div className={`flex items-center justify-center w-full h-full ${inverted ? "flex-col-reverse" : "flex-col"} ${className}`}>
      {piecePositions.map((rank, rankIndex) => (
        <div
          key={rankIndex}
          className={`flex items-center justify-center h-full w-full max-w-[calc(min(8vw, 64vh))] lg:max-w-none
            ${inverted ? "flex-row-reverse" : "flex-row"}`}
        >
          {rank.map((piece, fileIndex) => (
            <div
              key={fileIndex}
              className={`flex items-center justify-center w-full h-full max-h-[calc(min(64vw, 8vh))] lg:max-h-none
                ${(rankIndex + fileIndex) % 2 === 0 ? theme.light : theme.dark}`}
            >
              {piece !== "" && <img src={pieceImgs[piece]} alt={piece} className="w-full h-full object-contain" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
