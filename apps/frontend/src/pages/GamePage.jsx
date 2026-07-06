import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Ban, Flag, ArrowLeft, ArrowRight, Search, X, Crown } from "lucide-react";

import move from "../assets/sounds/move.mp3";
import capture from "../assets/sounds/capture.mp3";
import promotion from "../assets/sounds/promotion.mp3";
import check from "../assets/sounds/check.mp3";
import castle from "../assets/sounds/castle.mp3";
import gameover from "../assets/sounds/gameover.mp3";

import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";
import Button from "../components/ui/Button";
import Board from "../components/Board";

const GamePage = () => {
  const { gameId } = useParams();
  const { username, accessToken, wsUrl, logoutUser } = useAuthContext();
  const { addToast } = useToastContext();

  const [oppTime, setOppTime] = useState("10:00");
  const [selfTime, setSelfTime] = useState("10:00");

  // game metadata
  const [gameMetadata, setGameMetadata] = useState(null);
  const gameMetadataRef = useRef(null);
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
  const [winner, setWinner] = useState(null);

  // ui
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);
  const [showResignPrompt, setShowResignPrompt] = useState(false);
  const resignPromptRef = useRef(null);

  // sounds
  const move_sound = new Audio(move);
  const capture_sound = new Audio(capture);
  const promotion_sound = new Audio(promotion);
  const check_sound = new Audio(check);
  const castle_sound = new Audio(castle);
  const gameover_sound = new Audio(gameover);

  const debug = true;
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
        // only clear ref if this is still the active webSocket
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
      // only clear ref if this is still the active webSocket
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    // close ws properly on cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      // only clear ref if it still points to this instance
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, []);

  // close resign prompt on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResignPrompt && resignPromptRef.current && !resignPromptRef.current.contains(event.target)) {
        setShowResignPrompt(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResignPrompt]);

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

  const getCleanResult = (result) => {
    if (!result) {
      return "";
    }
    return result
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSelfUser = () => {
    // spectator - show self as white player
    if (!getIsUserParticipant()) {
      return {
        id: gameMetadata?.player1_id,
        rating: gameMetadata?.player1_elo,
        username: gameMetadata?.player1_username,
      };
    }

    // white player
    if (gameMetadata?.player1_username === username) {
      return {
        id: gameMetadata?.player1_id,
        rating: gameMetadata?.player1_elo,
        username: gameMetadata?.player1_username,
      };
    }
    // black player
    return {
      id: gameMetadata?.player2_id,
      rating: gameMetadata?.player2_elo,
      username: gameMetadata?.player2_username,
    };
  };

  const getOpponentUser = () => {
    // spectator - show opponent as black player
    if (!getIsUserParticipant()) {
      return {
        id: gameMetadata?.player2_id,
        rating: gameMetadata?.player2_elo,
        username: gameMetadata?.player2_username,
      };
    }

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

  const getIsUserParticipant = () => {
    const meta = gameMetadataRef.current ?? gameMetadata;
    return [meta?.player1_username, meta?.player2_username].includes(username);
  };

  const getWinnerUsername = () => {
    const meta = gameMetadataRef.current ?? gameMetadata;
    if (!winner) {
      return "";
    }
    return winner === "w" ? meta?.player1_username : meta?.player2_username;
  };

  const playMoveSound = (moveMsg) => {
    const sanMove = moveMsg?.san_moves?.[moveMsg.san_moves.length - 1];
    if (!sanMove) {
      return;
    }

    // select sound to play
    let soundToPlay = move_sound;
    if (sanMove.includes("+") || sanMove.includes("#")) {
      soundToPlay = check_sound;
    } else if (sanMove.includes("x")) {
      soundToPlay = capture_sound;
    } else if (sanMove.includes("O-O") || sanMove.includes("O-O-O")) {
      soundToPlay = castle_sound;
    } else if (sanMove.includes("=")) {
      soundToPlay = promotion_sound;
    }

    // play sound
    soundToPlay.currentTime = 0;
    soundToPlay.play().catch((e) => {
      if (e.name !== "NotAllowedError") {
        console.error("error playing sound:", e);
      }
    });

    // play gameover sound after soundToPlay.duration
    setTimeout(
      () => {
        if (moveMsg?.is_game_over) {
          gameover_sound.currentTime = 0;
          gameover_sound.play().catch((e) => {
            if (e.name !== "NotAllowedError") {
              console.error("error playing sound:", e);
            }
          });
        }
      },
      soundToPlay.duration * 1000 + 100,
    );
  };

  const handleWsMsg = (msg) => {
    switch (msg.type) {
      case "error": {
        if (["invalid token", "token expired"].includes(msg.error)) {
          addToast("Session expired, Please login again!", "red", 5);
          handleWsClose();
          logoutUser(false);
        } else if (["game is inactive"].includes(msg.error)) {
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
        gameMetadataRef.current = msg?.metadata;
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
        setWinner(msg?.data?.winner);

        // show game over overlay if game_is_over
        if (msg?.data?.is_game_over) {
          setShowGameOverOverlay(true);
        }
        break;
      }

      case "move": {
        // update details
        setGameData(msg);
        setFenString(msg?.fen);
        setSanMoves(msg?.san_moves);
        setUciMoves(msg?.uci_moves);
        setLegalMoves(msg?.legal_moves);
        setIsCheck(msg?.is_check);
        setIsGameOver(msg?.is_game_over);
        setTurn(msg?.turn);
        setResult(msg?.result);
        setWinner(msg?.winner);

        // play sound
        playMoveSound(msg);

        break;
      }

      case "resign": {
        setGameData(msg);
        setFenString(msg?.fen);
        setSanMoves(msg?.san_moves);
        setUciMoves(msg?.uci_moves);
        setLegalMoves(msg?.legal_moves);
        setIsCheck(msg?.is_check);
        setIsGameOver(msg?.is_game_over);
        setTurn(msg?.turn);
        setResult(msg?.result);
        setWinner(msg?.winner);

        gameover_sound.currentTime = 0;
        gameover_sound.play().catch((e) => {
          if (e.name !== "NotAllowedError") {
            console.error("error playing sound:", e);
          }
        });
        break;
      }

      case "game_over": {
        // update details
        setFenString(msg?.fen);
        setSanMoves(msg?.san_moves);
        setUciMoves(msg?.uci_moves);
        setLegalMoves(msg?.legal_moves);
        setIsCheck(msg?.is_check);
        setIsGameOver(msg?.is_game_over);
        setTurn(msg?.turn);
        setResult(msg?.result);
        setWinner(msg?.winner);
        setGameData({
          fen: msg?.fen,
          san_moves: msg?.san_moves,
          uci_moves: msg?.uci_moves,
          legal_moves: msg?.legal_moves,
          is_check: msg?.is_check,
          is_game_over: msg?.is_game_over,
          turn: msg?.turn,
          result: msg?.result,
          winner: msg?.winner,
        });

        // show game over overlay
        setShowGameOverOverlay(true);
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "move", move: uciMove }));
      if (debug) console.log("move sent:", uciMove);
    }
  };

  const handleResign = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "resign" }));
      if (debug) console.log("resign sent");
      setShowResignPrompt(false);
    }
  };

  return (
    <>
      {/* game over overlay */}
      {isGameOver && showGameOverOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-30 p-4">
          <div className="relative flex flex-col items-center gap-6 p-8 bg-surface border border-surface-hover rounded-2xl w-full max-w-sm">
            {/* close button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowGameOverOverlay(false)}
              className="rounded-full absolute top-4 right-4 text-text-weak hover:text-text-strong hover:bg-surface-hover"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* game result */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                {!getIsUserParticipant() ? (
                  <h2 className="text-text-strong font-extrabold text-4xl">Game Over</h2>
                ) : !winner ? (
                  <h2 className="text-text-strong font-extrabold text-4xl">Draw</h2>
                ) : winner === selfColor ? (
                  <h2 className="text-green-500 font-extrabold text-4xl">You Win!</h2>
                ) : (
                  <h2 className="text-red-500 font-extrabold text-4xl">You Lose!</h2>
                )}

                <p className="text-text-weak text-sm font-semibold">
                  {getIsUserParticipant()
                    ? winner
                      ? `by ${getCleanResult(result)}`
                      : `due to ${getCleanResult(result)}`
                    : winner
                      ? `${getWinnerUsername()} won by ${getCleanResult(result)}`
                      : `Draw due to ${getCleanResult(result)}`}
                </p>
              </div>
            </div>

            {/* winner card */}
            <div className="w-full flex flex-row gap-2 items-center justify-between p-4 bg-background/30 border border-surface-hover rounded-xl">
              {/* white player */}
              <div className="flex flex-col items-center flex-1 p-2 rounded-lg">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm bg-white text-black border-slate-300">
                    W
                  </div>
                  {winner === "w" && <Crown className="w-4 h-4 absolute -top-2 -right-1 text-transparent" fill="#F59E0B" />}
                </div>
                <span className="text-xs font-bold truncate max-w-[90px] mt-1 text-text-strong">
                  {gameMetadata?.player1_username} {gameMetadata?.player1_username === username && "(You)"}
                </span>
              </div>

              <div className="text-xs font-bold text-text-weak px-1">vs</div>

              {/* black player */}
              <div className="flex flex-col items-center flex-1 p-2 rounded-lg">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm bg-black text-white border-slate-700">
                    B
                  </div>
                  {winner === "b" && <Crown className="w-4 h-4 absolute -top-2 -right-1 text-transparent" fill="#F59E0B" />}
                </div>
                <span className="text-xs font-bold truncate max-w-[90px] mt-1 text-text-strong">
                  {gameMetadata?.player2_username} {gameMetadata?.player2_username === username && "(You)"}
                </span>
              </div>
            </div>

            {/* play again button */}
            {getIsUserParticipant() && (
              <Link to="/find-game" className="w-full mt-2">
                <Button className="w-full" variant="primary">
                  <Search className="w-4 h-4 mr-2" />
                  <span>Play another game</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* main content */}
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
              inverted={getIsUserParticipant() && selfColor === "b"}
              fenString={fenString}
              uciMoves={uciMoves}
              legalMoves={legalMoves}
              isCheck={isCheck}
              turn={turn}
              makeMove={makeMove}
              isGameOver={isGameOver}
              winner={winner}
              className="h-full max-h-[70vh] md:max-h-none aspect-square"
            />
          </div>

          {/* self details */}
          <div className="flex flex-row justify-between gap-3 w-full h-fit p-3 bg-surface border border-surface-hover rounded-md">
            <Link className="flex flex-row gap-3 items-center justify-center" to={`/user/${getSelfUser().id}`}>
              {/* self profile pic */}
              <div className="w-8 h-8 rounded-full bg-white"></div>

              {/* self name & rating */}
              <div className="flex flex-row items-center justify-center gap-1">
                <span className="font-bold">{getSelfUser().username}</span>
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
          {!isGameOver ? (
            <div className="shrink-0 relative flex flex-row gap-3 p-3 lg:bg-background/40 lg:border-t border-surface-hover">
              <div className="flex-1">
                <Button
                  variant="outline"
                  disabled={showResignPrompt}
                  className="w-full text-text bg-surface hover:text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50
                    active:text-yellow-500 active:bg-yellow-500/30 active:border-yellow-500/50 disabled:opacity-20"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  <span>Draw</span>
                </Button>
              </div>

              <div className="flex-1">
                {/* resign prompt overlay */}
                {showResignPrompt && (
                  <div
                    ref={resignPromptRef}
                    className="absolute t-0 l-0 -translate-x-[calc(100%-6px)] -translate-y-[calc(100%+24px)] p-4 w-1/2
                      flex flex-col gap-3 bg-surface border border-surface-hover rounded-md"
                  >
                    <p className="text-text-strong">Are you sure you want to resign?</p>
                    <div className="flex flex-row gap-3">
                      <Button variant="outline" onClick={() => setShowResignPrompt(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleResign()}
                        className="flex-1 text-white bg-red-600 hover:bg-red-700 active:bg-red-900"
                      >
                        Resign
                      </Button>
                    </div>
                  </div>
                )}
                {/* resign button */}
                <Button
                  variant="outline"
                  disabled={showResignPrompt}
                  onClick={() => setShowResignPrompt(true)}
                  className="w-full text-text bg-surface hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50
                    active:text-red-500 active:bg-red-500/30 active:border-red-500/50 disabled:opacity-20"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  <span>Resign</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 flex flex-row gap-3 p-3 lg:bg-background">
              <Link to="/find-game" className="flex-1">
                <Button className="w-full text-text bg-surface" variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  <span>Find another match</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GamePage;
