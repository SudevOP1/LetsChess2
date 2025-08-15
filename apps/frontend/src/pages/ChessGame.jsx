import { useEffect, useRef, useState } from "react";
import PageWithHeader from "../components/PageWithHeader";
import { useMyContext } from "../context/MyContext.jsx";
import ChessBoard from "../components/ChessBoard.jsx";
import { useParams } from "react-router-dom";

const ChessGame = () => {
  let { profileData, backendWsUrl, accessToken } = useMyContext();
  let { gameId } = useParams();

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

  let tempMoves = [
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
  ];
  let tempLegalMoves = [
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
  ];

  let debug = true;
  let [loading, setLoading] = useState(true);
  let [board, setBoard] = useState(getInitialBoard());

  // ws stuff
  let wsRef = useRef(null);
  let [gameData, setGameData] = useState(null);
  let [error, setError] = useState(null);
  let [log, setLog] = useState([]);

  useEffect(() => {
    let wsUrl = `${backendWsUrl}/game/${gameId}/?access_token=${accessToken}`;
    let ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (debug) console.log("connected to ws");
      setLog((prev) => [...prev, "connected to ws"]);
    };
    ws.onmessage = (event) => {
      try {
        let msg = JSON.parse(event.data);
        if (debug) console.log(msg);

        // error
        if (msg.error) {
          setError(msg.error);
          return;
        }

        // game data
        if (msg.type === "game_data") {
          setGameData(msg.game_data);
          setBoard(makeMovesAndGetBoard(msg.game_data.uci_moves));
          return;
        }

        // broadcasted move
        if (msg.type === "move") {
          setLog((prev) => [...prev, `move: ${msg.move.move}`]);
          setGameData((prev) => ({
            ...prev,
            turn: msg.move.turn,
            legal_moves: msg.move.legal_moves,
          }));
        }

        // broadcasted move and gameover
        if (msg.type === "move_and_gameover") {
          setLog((prev) => [
            ...prev,
            `move: ${msg.move_and_gameover.move}`,
            `gameover: ${msg.move_and_gameover.gameover}`,
          ]);
          setGameData((prev) => ({
            ...prev,
            turn: msg.move.turn,
            legal_moves: msg.moves.legal_moves,
          }));
        }
      } catch (e) {
        console.error(`error parsing msg: ${e}`);
      }
    };
    ws.onerror = (error) => {
      if (debug) console.error("ws error:", error);
      setError("ws connection error");
    };
    ws.onclose = () => {
      if (debug) console.log("disconnected from ws");
      setLog((prev) => [...prev, "disconnected from ws"]);
    };

    // cleanup on unmount
    return () => ws.close();
  }, [gameId, accessToken]);

  let sendMove = (uciMove) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ move: uciMove }));
    }
  };
  let makeMoveAndGetBoard = (
    board,
    fromRankIndex,
    fromFileIndex,
    toRankIndex,
    toFileIndex
  ) => {
    let newBoard = board.map((row) => [...row]);
    newBoard[toRankIndex][toFileIndex] = board[fromRankIndex][fromFileIndex];
    newBoard[fromRankIndex][fromFileIndex] = " ";
    return newBoard;
  };
  // TODO: put these helper functions in a separate file
  let getArrayNotation = (notation) => {
    return {
      file: notation[0].charCodeAt(0) - 97,
      rank: 8 - parseInt(notation[1]),
    };
  };
  let makeMovesAndGetBoard = (uciMoves) => {
    let newBoard = board.map((row) => [...row]);
    for (let move of uciMoves) {
      let { rank: fromRankIndex, file: fromFileIndex } = getArrayNotation(
        move.slice(0, 2)
      );
      let { rank: toRankIndex, file: toFileIndex } = getArrayNotation(
        move.slice(2, 4)
      );
      newBoard = makeMoveAndGetBoard(
        newBoard,
        fromRankIndex,
        fromFileIndex,
        toRankIndex,
        toFileIndex
      );
    }
    return newBoard;
  };
  let getSanMovesToDisplay = (sanMoves) => {
    let result = [];
    for (let i = 0; i < sanMoves.length; i += 2) {
      if (i + 1 < sanMoves.length) {
        result.push([sanMoves[i], sanMoves[i + 1]]);
      } else {
        result.push(sanMoves[i]);
      }
    }
    return result;
  };

  // return (
  //   <div className="bg-gray-900 text-white min-h-screen p-20">
  //     <h1 className="text-3xl text-yellow-400">GameData</h1>
  //     {gameData &&
  //       Object.entries(gameData).map(([key, value], index) => (
  //         <div key={index}>
  //           <span className="text-yellow-400">gameData.{key}: </span>
  //           <span>{String(value)}</span>
  //           <br />
  //         </div>
  //       ))}
  //     <div className="w-full h-[1px] my-5 bg-red-500" />

  //     <p className="text-3xl text-yellow-400">Error</p>
  //     {error && <p className="text-red-500">{String(error)}</p>}
  //     <div className="w-full h-[1px] my-5 bg-red-500" />

  //     <span className="text-3xl text-yellow-400">Log:</span>
  //     <button
  //       className="border border-yellow-400 p-2"
  //       onClick={() => sendMove(gameData.legal_moves[0])}
  //     >
  //       Send first legal move
  //     </button>
  //     <ul>
  //       {log.reverse().map((entry, idx) => (
  //         <li key={idx}>{entry}</li>
  //       ))}
  //     </ul>
  //   </div>
  // );

  if (gameData) {
    console.log(gameData);
    return (
      <PageWithHeader classNames="flex flex-col gap-1">
        <p className="text-lime-300 font-semibold text-2xl flex-none">
          {gameData.black} (black)
        </p>

        <div className="flex flex-col lg:flex-row gap-15 flex-1">
          <ChessBoard
            context={{
              board,
              setBoard,
              legal_moves: gameData.legal_moves,
              makeMoveAndGetBoard,
            }}
            classNames="flex-2"
          />

          <p className="block lg:hidden text-lime-300 font-semibold text-2xl flex-none -mt-14">
            {gameData.white} (white)
          </p>

          {/* moves card */}
          <div className="flex flex-col bg-blue-400/20 text-lime-300 px-8 py-5 rounded-2xl flex-2">
            <h1 className="color-lime-300 text-3xl font-semibold border-b-2 border-lime-300 pb-2 mb-2">
              Moves
            </h1>
            <div className="flex flex-col overflow-y-auto max-h-[55vh]">
              {getSanMovesToDisplay(gameData.san_moves).map((move, i) => (
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
          {gameData.white} (white)
        </p>
      </PageWithHeader>
    );
  } else return <p>loading</p>;
};

export default ChessGame;
