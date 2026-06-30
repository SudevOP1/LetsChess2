import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Ban, Flag, ArrowLeft, ArrowRight } from "lucide-react";

import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";
import Button from "../components/ui/Button";
import Board from "../components/Board";

const GamePage = () => {
  const { gameId } = useParams();
  const { userId, username, accessToken, wsUrl, logoutUser } = useAuthContext();
  const { addToast } = useToastContext();

  const [oppTime, setOppTime] = useState("10:00");
  const [selfTime, setSelfTime] = useState("10:00");

  // game metadata
  const [gameMetadata, setGameMetadata] = useState(null);
  const [selfColor, setSelfColor] = useState("w");

  // gamedata
  const [gameData, setGameData] = useState(null);
  const [fenString, setFenString] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [sanMoves, setSanMoves] = useState([]);
  const [uciMoves, setUciMoves] = useState([]);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isCheck, setIsCheck] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [turn, setTurn] = useState("w");
  const [result, setResult] = useState(null);

  const debug = false;
  let wsRef = useRef(null);

  // ws
  useEffect(() => {
    if (!accessToken || gameData?.is_game_over) {
      return;
    }

    const ws = new WebSocket(`${wsUrl}/game/${gameId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (debug) console.log("ws connected");
      ws.send(JSON.stringify({ type: "access_token", access_token: accessToken }));
      if (debug) console.log("sent access token");
    };

    ws.onmessage = (event) => {
      try {
        let msg = JSON.parse(event.data);
        if (debug) console.log(`received msg: ${JSON.stringify(msg)}`);
        handleWsMsg(msg);
      } catch (e) {
        console.error(`error parsing msg: ${e}`);
        // Only clear ref if this is still the active WebSocket
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }
    };

    ws.onerror = (error) => {
      console.error(`ws connection error: ${error}`);
    };

    ws.onclose = (event) => {
      if (debug) console.log(`disconnected from ws (code: ${event.code}, reason: ${event.reason})`);
      // Only clear ref if this is still the active WebSocket
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    // close ws properly on cleanup (e.g. StrictMode remount or unmount)
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      // Only clear ref if it still points to this instance
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, []);

  const getMovePairs = (sanMoves = []) => {
    if (!sanMoves) {
      return [];
    }
    const pairs = [];
    for (let i = 0; i < sanMoves.length; i += 2) {
      if (i + 1 < sanMoves.length) {
        pairs.push([sanMoves[i], sanMoves[i + 1]]);
      } else {
        pairs.push([sanMoves[i]]);
      }
    }
    return pairs;
  };

  const getSelfUser = () => {
    // white player
    if (gameMetadata?.player1_username === username) {
      return {
        id: userId,
        rating: gameMetadata?.player1_elo,
        username: username,
      };
    }
    // black player
    return {
      id: userId,
      rating: gameMetadata?.player2_elo,
      username: username,
    };
  };

  const getOpponentUser = () => {
    // black opponent
    if (gameMetadata?.player1_username === username) {
      return {
        id: gameMetadata?.player2_id,
        rating: gameMetadata?.player2_elo,
        username: gameMetadata?.player2_username,
      };
    }
    // white opponent
    return {
      id: gameMetadata?.player1_id,
      rating: gameMetadata?.player1_elo,
      username: gameMetadata?.player1_username,
    };
  };

  const handleWsMsg = (msg) => {
    switch (msg.type) {
      case "error": {
        if (["invalid token", "token expired"].includes(msg.error)) {
          addToast("Session expired, Please login again!", "red", 5);
          handleWsClose();
          logoutUser(false);
        } else if (msg.error === "game is inactive") {
          setGameData((prev) => (prev ? { ...prev, is_game_over: true } : { is_game_over: true }));
          setIsGameOver(true);
          handleWsClose();
        } else {
          console.error("error msg received from ws: ", msg.error);
          addToast("Something went wrong", "red", 5);
          handleWsClose();
        }
        break;
      }

      case "metadata": {
        setGameMetadata(msg?.metadata);
        if (msg?.metadata?.player1_username === username) {
          setSelfColor("w");
        } else {
          setSelfColor("b");
        }
        break;
      }

      case "data": {
        setGameData(msg?.data);
        setFenString(msg?.data?.fen);
        setSanMoves(msg?.data?.san_moves);
        setUciMoves(msg?.data?.uci_moves);
        setLegalMoves(msg?.data?.legal_moves);
        setIsCheck(msg?.data?.is_check);
        setIsGameOver(msg?.data?.is_game_over);
        setTurn(msg?.data?.turn);
        setResult(msg?.data?.result);
        break;
      }

      case "move":
      case "game_over": {
        setFenString(msg?.fen);
        setSanMoves(msg?.san_moves);
        setUciMoves(msg?.uci_moves);
        setLegalMoves(msg?.legal_moves);
        setIsCheck(msg?.is_check);
        setIsGameOver(msg?.is_game_over);
        setTurn(msg?.turn);
        setResult(msg?.result);
        setGameData({
          fen: msg?.fen,
          san_moves: msg?.san_moves,
          uci_moves: msg?.uci_moves,
          legal_moves: msg?.legal_moves,
          is_check: msg?.is_check,
          is_game_over: msg?.is_game_over,
          turn: msg?.turn,
          result: msg?.result,
        });
        break;
      }

      case "invalid_message": {
        break;
      }

      default: {
        console.error("received msg with unknown type: ", msg);
      }
    }
  };

  const handleWsClose = () => {
    if (debug) console.log("handleWsClose called");
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  };

  const makeMove = (uciMove) => {
    console.log("wsRef.current:", wsRef.current);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "move", move: uciMove }));
      if (debug) console.log("move sent:", uciMove);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-screen h-full min-h-screen p-3 md:max-w-4xl lg:max-w-6xl mx-auto">
      {/* left panel */}
      <div className="flex flex-col gap-4 h-full">
        {/* opponent details */}
        <div className="flex flex-row justify-between gap-3 w-full h-fit p-3 bg-surface border border-surface-hover rounded-md">
          <Link className="flex flex-row gap-3 items-center justify-center" to={`/user/${getOpponentUser().id}`}>
            {/* opponent profile pic */}
            <div className="w-8 h-8 rounded-full bg-white"></div>

            {/* opponent name & rating */}
            <div className="flex flex-row items-center justify-center gap-1">
              <span className="font-bold">{getOpponentUser().username}</span>
              <span className="font-[consolas] px-2 bg-surface-hover rounded text-sm">{getOpponentUser().rating}</span>
            </div>
          </Link>

          {/* opponent remaining time */}
          <span className="text-center font-[consolas] font-bold text-2xl">{oppTime}</span>
        </div>

        {/* board */}
        <div className="flex-none p-3 rounded-md bg-surface border border-surface-hover flex items-center justify-center lg:h-[calc(100vh-163px)]">
          <Board
            selfColor={selfColor}
            inverted={selfColor === "b"}
            fenString={fenString}
            uciMoves={uciMoves}
            legalMoves={legalMoves}
            isCheck={isCheck}
            turn={turn}
            makeMove={makeMove}
            className="h-full max-h-[70vh] md:max-h-none aspect-square"
          />
        </div>

        {/* self details */}
        <div className="flex flex-row justify-between gap-3 w-full h-fit p-3 bg-surface border border-surface-hover rounded-md">
          <Link className="flex flex-row gap-3 items-center justify-center" to={`/user/${username}`}>
            {/* self profile pic */}
            <div className="w-8 h-8 rounded-full bg-white"></div>

            {/* self name & rating */}
            <div className="flex flex-row items-center justify-center gap-1">
              <span className="font-bold">{username}</span>
              <span className="font-[consolas] px-2 bg-surface-hover rounded text-sm">{getSelfUser().rating}</span>
            </div>
          </Link>

          {/* self remaining time */}
          <span className="text-center font-[consolas] font-bold text-2xl">{selfTime}</span>
        </div>
      </div>

      {/* right panel */}
      <div className="flex flex-col-reverse lg:flex-col min-w-60 w-full lg:h-[calc(100vh-24px)] bg-surface border border-surface-hover rounded-md">
        {/* moves container */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start w-full h-full scrollbar-thin">
          {/* header */}
          <div className="lg:sticky lg:top-0 lg:left-0 flex flex-row items-center justify-between p-3 bg-background/40 backdrop-blur-lg border-y lg:border-t-transparent border-surface-hover lg:rounded-t-md">
            <span className="font-bold">Moves</span>
            <div className="flex flex-row items-center justify-center gap-2">
              <Button size="icon" variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* moves */}
          <div className="flex flex-col p-3">
            {getMovePairs(sanMoves).map((nthMove, n) => (
              <div
                key={n}
                className={`flex flex-row justify-between px-2 py-1 w-full text-sm md:text-lg rounded
                ${n % 2 === 0 ? "bg-background/40" : ""}`}
              >
                <div
                  className={`flex-1
                  ${n === getMovePairs(sanMoves).length - 1 ? "text-text-strong font-semibold" : "text-text-weak"}`}
                >
                  {n + 1}.
                </div>
                <div
                  className={`flex-1 text-text
                  ${n === getMovePairs(sanMoves).length - 1 && "text-text-strong font-semibold"}`}
                >
                  {nthMove[0]}
                </div>
                <div
                  className={`flex-1 text-text
                  ${n === getMovePairs(sanMoves).length - 1 && "text-text-strong font-semibold"}`}
                >
                  {nthMove[1] ? nthMove[1] : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* buttons */}
        <div className="shrink-0 flex flex-row gap-3 p-3 lg:bg-background/40 lg:border-t border-surface-hover">
          <Button
            className="flex-1 text-text bg-surface hover:text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50 active:text-yellow-500 active:bg-yellow-500/30 active:border-yellow-500/50"
            variant="outline"
          >
            <Flag className="w-4 h-4 mr-2" />
            <span>Draw</span>
          </Button>
          <Button
            className="flex-1 text-text bg-surface hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 active:text-red-500 active:bg-red-500/30 active:border-red-500/50"
            variant="outline"
          >
            <Ban className="w-4 h-4 mr-2" />
            <span>Resign</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
