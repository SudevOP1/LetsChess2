import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Ban, Flag, ArrowLeft, ArrowRight, Search, X, Crown, Bot } from "lucide-react";
import { Chess } from "chess.js";

import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";
import { useApiContext } from "../context/ApiContext";
import Logger from "../services/logger.js";
import Button from "../components/ui/Button";
import Board from "../components/Board";

import move from "../assets/sounds/move.mp3";
import capture from "../assets/sounds/capture.mp3";
import promotion from "../assets/sounds/promotion.mp3";
import check from "../assets/sounds/check.mp3";
import castle from "../assets/sounds/castle.mp3";
import gameover from "../assets/sounds/gameover.mp3";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const GamePage = () => {
  const { gameId } = useParams();
  // /game/vs-bot has no :gameId - it's the "pick a color" setup screen for a bot game
  const isBotSetup = gameId === undefined;

  const { username, accessToken, wsUrl, backendUrl, logoutUser } = useAuthContext();
  const { addToast } = useToastContext();
  const { fetchApi } = useApiContext();
  const navigate = useNavigate();
  const location = useLocation();

  // bot setup screen state
  const [botColor, setBotColor] = useState("w");
  const [creatingBotGame, setCreatingBotGame] = useState(false);
  const setupLegalMoves = new Chess().moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion || ""}`);
  // move made on the setup board before the game exists - sent once the real game connects
  const pendingMoveRef = useRef(location.state?.pendingMove ?? null);

  const createBotGame = async (color) => {
    const [success, data] = await fetchApi(`${backendUrl}/game/vs-bot`, "POST", { color }, setCreatingBotGame);
    if (!success) {
      Logger.error("Failed to create bot game", data);
      addToast("Something went wrong", "red", 5);
      return null;
    }
    return data.game_id;
  };

  // white's first move is what actually creates the game
  const handleSetupMove = async (uciMove) => {
    const newGameId = await createBotGame("white");
    if (!newGameId) {
      return;
    }
    navigate(`/game/${newGameId}`, { replace: true, state: { pendingMove: uciMove } });
  };

  // playing black means the bot moves first, so there's no move to defer - just create the game
  const handlePlayAsBlack = async () => {
    const newGameId = await createBotGame("black");
    if (!newGameId) {
      return;
    }
    navigate(`/game/${newGameId}`, { replace: true });
  };

  const [oppTime, setOppTime] = useState("10:00");
  const [selfTime, setSelfTime] = useState("10:00");

  // game metadata
  const [gameMetadata, setGameMetadata] = useState(null);
  const gameMetadataRef = useRef(null);
  const [selfColor, setSelfColor] = useState("w");
  const [newElos, setNewElos] = useState({});

  // gamedata
  const [gameData, setGameData] = useState(null);
  const [fenString, setFenString] = useState(STARTING_FEN);
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
  const [drawOfferState, setDrawOfferState] = useState(null); // null | "sent" | "received"
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 means viewing latest move

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
    if (!accessToken || isBotSetup || gameData?.is_game_over) {
      return;
    }

    const ws = new WebSocket(`${wsUrl}/game/${gameId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      Logger.log("ws connected");
      ws.send(JSON.stringify({ type: "access_token", access_token: accessToken }));
      Logger.log("sent access token");
    };

    ws.onmessage = (event) => {
      try {
        let msg = JSON.parse(event.data);
        Logger.log(`received msg: ${JSON.stringify(msg)}`);
        handleWsMsg(msg);
      } catch (e) {
        Logger.error(`error parsing msg: ${e}`);
        // only clear ref if this is still the active webSocket
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }
    };

    ws.onerror = (error) => {
      Logger.error(`ws connection error: ${error}`);
    };

    ws.onclose = (event) => {
      Logger.log(`disconnected from ws (code: ${event.code}, reason: ${event.reason})`);
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
        Logger.error("error playing sound:", e);
      }
    });

    // play gameover sound after soundToPlay.duration
    setTimeout(
      () => {
        if (moveMsg?.is_game_over) {
          gameover_sound.currentTime = 0;
          gameover_sound.play().catch((e) => {
            if (e.name !== "NotAllowedError") {
              Logger.error("error playing sound:", e);
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
        } else if (["game not found"].includes(msg.error)) {
          addToast("Game not found", "red", 5);
          navigate("/find-game");
          handleWsClose();
        } else {
          Logger.error("error msg received from ws: ", msg.error);
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

        // send the move made on the bot setup board, now that the game exists
        if (pendingMoveRef.current) {
          const pendingMove = pendingMoveRef.current;
          pendingMoveRef.current = null;
          makeMove(pendingMove);
        }

        setCurrentMoveIndex(-1);
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

        setCurrentMoveIndex(-1);

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
            Logger.error("error playing sound:", e);
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
        setNewElos({
          w: msg?.player1_elo,
          b: msg?.player2_elo,
        });

        // show game over overlay
        setShowGameOverOverlay(true);
        break;
      }

      case "draw_offer_sent": {
        setDrawOfferState("sent");
        break;
      }

      case "draw_offered": {
        setDrawOfferState("received");
        break;
      }

      case "draw_declined": {
        const opponentLabel = gameMetadataRef.current?.vs_bot ? "Bot" : "Opponent";
        setDrawOfferState((prev) => {
          // only toast if it was my offer that got turned down, not my own cancel/decline
          if (prev === "sent") {
            addToast(`${opponentLabel} declined the draw offer`, "red", 4);
          }
          return null;
        });
        break;
      }

      case "draw": {
        const opponentLabel = gameMetadataRef.current?.vs_bot ? "Bot" : "Opponent";
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
        setDrawOfferState((prev) => {
          if (prev === "sent") {
            addToast(`${opponentLabel} accepted the draw offer`, "green", 4);
          }
          return null;
        });

        gameover_sound.currentTime = 0;
        gameover_sound.play().catch((e) => {
          if (e.name !== "NotAllowedError") {
            Logger.error("error playing sound:", e);
          }
        });
        break;
      }

      case "invalid_message": {
        break;
      }

      default: {
        Logger.error("received msg with unknown type: ", msg);
      }
    }
  };

  const handleWsClose = () => {
    Logger.log("handleWsClose called");
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
      Logger.log("move sent:", uciMove);
    }
  };

  const handleResign = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "resign" }));
      Logger.log("resign sent");
      setShowResignPrompt(false);
    }
  };

  const handleOfferDraw = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "offer_draw" }));
      Logger.log("draw offer sent");
    }
  };

  const handleAcceptDraw = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "accept_draw" }));
      Logger.log("draw accept sent");
    }
  };

  const handleDeclineDraw = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "decline_draw" }));
      Logger.log("draw decline sent");
    }
  };

  const handlePrevMove = () => {
    const currentIndex = currentMoveIndex === -1 ? uciMoves.length : currentMoveIndex;
    if (currentIndex > 0) {
      setCurrentMoveIndex(currentIndex - 1);
      playMoveSound({ san_moves: [sanMoves[currentIndex - 1]] });
    }
  };

  const handleNextMove = () => {
    // already at latest
    if (currentMoveIndex === -1) {
      return;
    }

    const nextIndex = currentMoveIndex + 1;
    if (nextIndex >= uciMoves.length) {
      setCurrentMoveIndex(-1);
      playMoveSound({ san_moves: [sanMoves[sanMoves.length - 1]] });
    } else {
      setCurrentMoveIndex(nextIndex);
      playMoveSound({ san_moves: [sanMoves[currentMoveIndex]] });
    }
  };

  const handleSetCurrentMoveIndex = (moveIndex) => {
    setCurrentMoveIndex(moveIndex);

    // play sound
    if (moveIndex === -1) {
      playMoveSound({ san_moves: [sanMoves[sanMoves.length - 1]] });
    } else {
      playMoveSound({ san_moves: [sanMoves[moveIndex]] });
    }
  };

  // keyboard input for arrow keys
  useEffect(() => {
    const handleKeyDown = (event) => {
      Logger.log("key press detected:", event.key);
      if (event.key === "ArrowRight") {
        handleNextMove();
      }
      if (event.key === "ArrowLeft") {
        handlePrevMove();
      }
    };

    // Add the listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the listener when the component unmounts to prevent memory leaks
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNextMove, handlePrevMove]);

  const getHistoryFen = () => {
    if (currentMoveIndex === uciMoves.length || currentMoveIndex === -1) {
      return fenString;
    }
    try {
      const chess = new Chess();
      for (let i = 0; i < currentMoveIndex; i++) {
        const move = uciMoves[i];
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const promotion = move.length > 4 ? move[4] : undefined;
        chess.move({ from, to, promotion });
      }
      return chess.fen();
    } catch (e) {
      Logger.error("Error generating history fen:", e);
      return fenString;
    }
  };

  // bot setup screen - pick a color, no game exists yet
  if (isBotSetup) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 w-screen h-full min-h-screen p-3 md:max-w-4xl lg:max-w-6xl mx-auto">
        {/* board */}
        <div className="flex-1 flex flex-col gap-4 h-full">
          <div className="flex-none p-3 rounded-md bg-surface border border-surface-hover flex items-center justify-center lg:h-[calc(100vh-24px)]">
            <Board
              selfColor={botColor}
              inverted={botColor === "b"}
              fenString={STARTING_FEN}
              uciMoves={[]}
              legalMoves={botColor === "w" ? setupLegalMoves : []}
              isCheck={false}
              turn="w"
              makeMove={handleSetupMove}
              isGameOver={false}
              winner={null}
              isViewingHistory={false}
              className="h-full max-h-[70vh] md:max-h-none aspect-square"
            />
          </div>
        </div>

        {/* right panel */}
        <div className="flex flex-col min-w-60 w-full lg:h-[calc(100vh-24px)] bg-surface border border-surface-hover rounded-md p-6 gap-6">
          <div className="flex flex-row gap-3 items-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-strong">Play vs Bot</h2>
              <p className="text-sm text-text-weak">Choose your color to begin.</p>
            </div>
          </div>

          {/* color toggle */}
          <div className="flex flex-row gap-2 p-1 bg-background/40 rounded-xl border border-surface-hover">
            <Button
              variant={botColor === "w" ? "primary" : "ghost"}
              onClick={() => setBotColor("w")}
              className="flex-1"
            >
              Play as White
            </Button>
            <Button
              variant={botColor === "b" ? "primary" : "ghost"}
              onClick={() => setBotColor("b")}
              className="flex-1"
            >
              Play as Black
            </Button>
          </div>

          {botColor === "w" ? (
            <p className="text-sm text-text-weak">Make a move on the board to start the game.</p>
          ) : (
            <Button
              isLoading={creatingBotGame}
              variant="primary"
              onClick={() => handlePlayAsBlack()}
              className="w-full py-4 text-base font-bold"
            >
              Play as Black
            </Button>
          )}
        </div>
      </div>
    );
  }

  const displayFen = getHistoryFen();
  const displayUciMoves = currentMoveIndex === -1 ? uciMoves : uciMoves.slice(0, currentMoveIndex);
  const displayLegalMoves = currentMoveIndex === -1 ? legalMoves : [];

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
                {newElos.w && (
                  <span
                    className={`mt-2 text-xl font-bold
                      ${newElos.w - gameMetadata?.player1_elo > 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {newElos.w - gameMetadata?.player1_elo > 0 && "+"}
                    {newElos.w - gameMetadata?.player1_elo}
                  </span>
                )}
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
                {newElos.b && (
                  <span
                    className={`mt-2 text-xl font-bold
                      ${newElos.b - gameMetadata?.player2_elo > 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {newElos.b - gameMetadata?.player2_elo > 0 && "+"}
                    {newElos.b - gameMetadata?.player2_elo}
                  </span>
                )}
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
              fenString={displayFen}
              uciMoves={displayUciMoves}
              legalMoves={displayLegalMoves}
              isCheck={isCheck && currentMoveIndex === -1}
              turn={turn}
              makeMove={makeMove}
              isGameOver={isGameOver}
              winner={winner}
              isViewingHistory={currentMoveIndex !== -1}
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
                <Button size="icon" variant="outline" className="rounded-full" onClick={() => handlePrevMove()}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-full" onClick={() => handleNextMove()}>
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
                  <div className={"flex-1 text-text-weak"}>{n + 1}.</div>
                  <div className="flex-1">
                    <div
                      onClick={() => handleSetCurrentMoveIndex(n * 2 + 1)}
                      className={`w-fit px-2 text-text cursor-pointer hover:bg-surface-hover rounded
                        ${(n * 2 + 1 === currentMoveIndex || (currentMoveIndex === -1 && n * 2 + 1 === sanMoves.length)) && "text-text-strong font-semibold"}`}
                    >
                      {nthMove[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      onClick={() => handleSetCurrentMoveIndex(n * 2 + 2)}
                      className={`w-fit px-2 text-text cursor-pointer hover:bg-surface-hover rounded
                        ${(n * 2 + 2 === currentMoveIndex || (currentMoveIndex === -1 && n * 2 + 2 === sanMoves.length)) && "text-text-strong font-semibold"}`}
                    >
                      {nthMove[1] ? nthMove[1] : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* buttons */}
          {!isGameOver ? (
            <div className="shrink-0 relative flex flex-row gap-3 p-3 lg:bg-background/40 lg:border-t border-surface-hover">
              {drawOfferState === "received" ? (
                <>
                  <div className="flex-1 flex items-center">
                    <span className="text-sm font-semibold text-text-strong">Opponent offers a draw</span>
                  </div>
                  <div className="flex flex-row gap-3">
                    <Button variant="outline" onClick={() => handleDeclineDraw()} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleAcceptDraw()}
                      className="flex-1 text-white bg-green-600 hover:bg-green-700 active:bg-green-900"
                    >
                      Accept
                    </Button>
                  </div>
                </>
              ) : drawOfferState === "sent" ? (
                <>
                  <div className="flex-1 flex items-center">
                    <span className="text-sm font-semibold text-text-weak">Draw offer sent</span>
                  </div>
                  <div className="flex-1">
                    <Button variant="outline" onClick={() => handleDeclineDraw()} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      disabled={showResignPrompt}
                      onClick={() => handleOfferDraw()}
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
                </>
              )}
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
