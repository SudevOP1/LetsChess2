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
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];

  let debug = false;
  let [board, setBoard] = useState(getInitialBoard());

  // ws stuff
  let wsRef = useRef(null);
  let [gameMetadata, setGameMetadata] = useState(null);
  let [gameData, setGameData] = useState(null);
  let [logs, setLogs] = useState([]);

  // ws connection
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let wsUrl = `${backendWsUrl}/game/${gameId}/?access_token=${accessToken}`;
    let ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog("ws connected", "", "yellow");
    };
    ws.onmessage = (event) => {
      try {
        let msg = JSON.parse(event.data);
        if (msg.error) {
          addLog(`recieved error: ${msg.error}`, "", "red");
          return;
        }
        if (msg.type === "game_metadata") {
          addLog("recieved game_metadata", msg.game_metadata, "white");
          setGameMetadata(msg.game_metadata);
          return;
        }
        if (msg.type === "game_data") {
          addLog("recieved game_data", msg.game_data, "white");
          setGameData(msg.game_data);
          setBoard(makeMovesAndGetBoard(msg.game_data.uci_moves));
          return;
        }
      } catch (e) {
        addLog(`error parsing msg: ${e}`, "", "red");
      }
    };
    ws.onerror = (error) => {
      addLog("ws connection error", error, "red");
    };
    ws.onclose = () => {
      addLog("disconnect from ws", "", "yellow");
    };

    // close ws properly
    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [gameId, accessToken]);

  let addLog = (msg, data, color = "white") => {
    let currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    let msgWithTime = `${currentTime}:${
      data === "" ? "" : " (logged in console)"
    } ${msg}`;

    if (debug && data !== "") {
      if (color === "red") {
        console.error(`${currentTime}: ${msg}: `, data);
      } else {
        console.log(`${currentTime}: ${msg}: `, data);
      }
    }
    setLogs((prev) => [...prev, { msg: msgWithTime, color: color }]);
  };
  let trySendingUciMove = (uciMove) => {
    if (gameData.gameover !== "ongoing") {
      addLog("handled sending move, when game is over", "", "yellow");
      return;
    }
    if (!uciMove) {
      addLog("handled sending undefined move", "", "yellow");
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ move: uciMove }));
      addLog(`tried sending move: ${uciMove}`);
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
  let isValidTurn = () => {
    return (
      gameData.turn ===
      (gameMetadata.white === profileData.username ? "w" : "b")
    );
  };

  if (!gameData) {
    return (
      <PageWithHeader classNames="flex flex-col gap-1">
        <div className="flex items-center justify-center h-64">
          <p className="text-lime-300 text-xl">Loading game...</p>
        </div>
      </PageWithHeader>
    );
  }

  return (
    <>
      {debug ? (
        // debug menu
        <div className="bg-gray-900 text-white min-h-screen w-full p-20">
          {/* GameMetadata */}
          <h1 className="text-3xl text-yellow-400">GameMetadata</h1>
          {gameMetadata &&
            Object.entries(gameMetadata).map(([key, value], index) => (
              <div key={index}>
                <span className="text-yellow-400">gameMetadata.{key}: </span>
                <span>{String(value)}</span>
                <br />
              </div>
            ))}
          <div className="w-full h-[1px] my-5 bg-red-500" />

          {/* GameData */}
          <h1 className="text-3xl text-yellow-400">GameData</h1>
          {gameData &&
            Object.entries(gameData).map(([key, value], index) => (
              <div key={index}>
                <span className="text-yellow-400">gameData.{key}: </span>
                <span>{String(value)}</span>
                <br />
              </div>
            ))}
          <div className="w-full h-[1px] my-5 bg-red-500" />

          {/* Logs */}
          <span className="text-3xl text-yellow-400">Logs:</span>
          <button
            className="border border-yellow-400 p-2 ml-2 cursor-pointer"
            onClick={() => trySendingUciMove(gameData.legal_moves[0])}
          >
            Send first legal move
          </button>
          <ul className="flex flex-col-reverse">
            {logs.map((log, idx) => (
              <li
                key={idx}
                className={
                  {
                    white: "text-white",
                    red: "text-red-500",
                    yellow: "text-yellow-500",
                  }[log.color]
                }
              >
                {log.msg}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // chess game
        <PageWithHeader classNames="flex flex-col gap-1">
          <p className="text-lime-300 font-semibold text-2xl flex-none">
            {gameData.black} (black)
          </p>

          <div className="flex flex-col lg:flex-row gap-15 flex-1">
            <ChessBoard
              board={board}
              legalMoves={isValidTurn() ? gameData.legal_moves : []}
              trySendingUciMove={trySendingUciMove}
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
                {(() => {
                  const sanMoves = [];
                  for (let i = 0; i < gameData.san_moves.length; i += 2) {
                    sanMoves.push([
                      gameData.san_moves[i],
                      gameData.san_moves[i + 1],
                    ]);
                  }
                  return sanMoves.map(([white, black], idx) => (
                    <div className="flex flex-row gap-5" key={idx}>
                      <span className="w-[10%]">{idx + 1}.</span>
                      <span className="flex-1">{white}</span>
                      <span className="flex-1">{black || ""}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <p className="hidden lg:block text-lime-300 font-semibold text-2xl flex-none">
            {gameData.white} (white)
          </p>
        </PageWithHeader>
      )}
    </>
  );
};

export default ChessGame;
