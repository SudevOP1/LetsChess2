import { useState } from "react";
import PageWithHeader from "../components/PageWithHeader";
import { useMyContext } from "../context/MyContext.jsx";
import ChessBoard from "../components/ChessBoard.jsx";

const ChessGame = () => {
  let { profileData } = useMyContext();

  let getInitialBoard = () => [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", "p", "p", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];

  let player1Name = profileData.username || "You";
  let player2Name = "Hikaru";
  let [board, setBoard] = useState(getInitialBoard());
  let [moves, setMoves] = useState([
    ["Naxb8=N#", "Naxb8=N#"],
    ["d4", "d5"],
    ["Bf4", "Nf6"],
    ["e3", "g6"],
    ["Nf3", "Bg7"],
    ["Bd3", "O-O"],
    ["O-O", "Bf5"],
    ["c3", "Nbd7"],
    ["Nh4", "Bg4"],
    ["f3", "Bf5"],
    ["Nxf5", "gxf5"],
    ["Bxf5", "c6"],
    ["Nd2", "b6"],
    ["e4", "e6"],
    ["Bg4", "dxe4"],
    ["fxe4", "c5"],
    ["Be2", "cxd4"],
    ["cxd4", "Rb8"],
    ["Bxb8", "Qxb8"],
    ["Bd3", "h5"],
    ["e5", "Ng4"],
    ["h3", "Ne3"],
    ["Qxh5", "Nf5"],
    ["Rxf5", "exf5"],
    ["Bxf5", "f6"],
    ["Be6+", "Rf7"],
    ["Qxf7+", "Kh7"],
    ["Bf5+", "Kh6"],
    ["Qg6#"],
  ]);
  let [availableMoves, setAvailableMoves] = useState([
    "g1h3",
    "g1f3",
    "b1c3",
    "b1a3",
    "h2h3",
    "g2g3",
    "f2f3",
    "e2e3",
    "d2d3",
    "c2c3",
    "b2b3",
    "a2a3",
    "h2h4",
    "g2g4",
    "f2f4",
    "e2e4",
    "d2d4",
    "c2c4",
    "b2b4",
    "a2a4",
  ]);

  return (
    <PageWithHeader classNames="flex flex-col gap-1">
      <p className="text-lime-300 font-semibold text-2xl flex-none">
        {player2Name} (black)
      </p>

      <div className="flex flex-col lg:flex-row gap-15 flex-1">
        <ChessBoard context={{ board, setBoard, availableMoves }} classNames="flex-2" />

        <p className="block lg:hidden text-lime-300 font-semibold text-2xl flex-none -mt-14">
          {player1Name} (white)
        </p>

        {/* moves card */}
        <div className="flex flex-col bg-blue-400/20 text-lime-300 px-8 py-5 rounded-2xl flex-2">
          <h1 className="color-lime-300 text-3xl font-semibold border-b-2 border-lime-300 pb-2 mb-2">
            Moves
          </h1>
          <div className="flex flex-col overflow-y-auto max-h-[55vh]">
            {moves.map((move, i) => (
              <div className="flex flex-row gap-5" key={i}>
                <span className="w-[10%]">{i + 1}.</span>
                <span className="flex-1">{move[0]}</span>
                <span className="flex-1">{move[1] && move[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="hidden lg:block text-lime-300 font-semibold text-2xl flex-none">
        {player1Name} (white)
      </p>
    </PageWithHeader>
  );
};

export default ChessGame;
