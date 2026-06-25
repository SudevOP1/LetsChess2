import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Trophy } from "lucide-react";

import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";
import { useApiContext } from "../context/ApiContext";
import Button from "../components/ui/Button";
import Board from "../components/Board";
import LoadingScreen from "../components/LoadingScreen";

const GamePage = () => {
  const { backendUrl, wsUrl, accessToken, username, logoutUser } = useAuthContext();
  const { addToast } = useToastContext();
  const { fetchApi } = useApiContext();
  const navigate = useNavigate();

  const [selfData, setSelfData] = useState({});
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState("idle"); // idle, searching
  const fenString = "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4";
  let wsRef = useRef(null);

  const fetchSelfData = async () => {
    const [success, data] = await fetchApi(`${backendUrl}/user/me`, "GET", null, setLoading);
    if (!success) {
      return console.error(data.error);
    }
    setSelfData(data.me);
  };

  const handleFindMatch = () => {
    setState("searching");
  };

  let handleCancelSearch = () => {
    const ws = wsRef.current;

    setState("idle");

    // ws not open
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // try cancelling search
    try {
      ws.send(JSON.stringify({ type: "cancel" }));
    } catch (error) {
      console.error(`error cancelling search: ${error.message}`);
    }

    // close ws
    ws.close();
    wsRef.current = null;
  };

  const handleWsMsg = (msg) => {
    switch (msg.type) {
      case "error": {
        if (msg.error === "invalid token") {
          addToast("Session expired, Please login again", "red", 5);
          handleWsClose();
          logoutUser(false);
        } else {
          console.log("error msg received from ws: ", msg.error);
          addToast("Something went wrong", "red", 5);
          handleWsClose();
        }
        break;
      }

      case "waiting": {
        console.log("added to matchmaking queue");
        break;
      }

      case "found": {
        console.log("match found");
        addToast("Match found!", "green", 3);
        handleWsClose();
        navigate(`/game/${msg.game_id}`);
        break;
      }

      default: {
        console.error("received msg with unknown type: ", msg);
        addToast("Something went wrong", "red", 5);
        handleWsClose();
      }
    }
  };

  const handleWsClose = () => {
    setState("idle");
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
  };

  // fetch self data
  useEffect(() => {
    fetchSelfData();
  }, []);

  // ws for matchmaking
  useEffect(() => {
    if (!accessToken || state === "idle") {
      return;
    }

    let ws = new WebSocket(`${wsUrl}/game/find`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("ws connected");
      ws.send(JSON.stringify({ type: "access_token", access_token: accessToken }));
      console.log("sent access token");
    };

    ws.onmessage = (event) => {
      try {
        let msg = JSON.parse(event.data);
        console.log(`received msg: ${JSON.stringify(msg)}`);
        handleWsMsg(msg);
      } catch (e) {
        console.error(`error parsing msg: ${e}`);
        handleWsClose();
      }
    };

    ws.onerror = (error) => {
      console.error(`ws connection error: ${error}`);
      addToast("Something went wrong", "red", 5);
      handleWsClose();
    };

    ws.onclose = (event) => {
      console.log(`disconnected from ws (code: ${event.code}, reason: ${event.reason})`);
      handleWsClose();
    };

    // close ws properly
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [state]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-screen h-full min-h-screen p-3 md:max-w-4xl lg:max-w-6xl mx-auto">
      {/* left panel */}
      <div className="hidden lg:flex flex-col gap-4 h-full">
        {/* opponent details */}
        <div className="flex flex-row justify-between gap-3 w-full h-fit p-3 bg-surface border border-surface-hover rounded-md">
          <div className="flex flex-row gap-3 items-center justify-center">
            {/* opponent profile pic */}
            <div className="w-8 h-8 rounded-full bg-white"></div>

            {/* opponent name & rating */}
            <div className="flex flex-row items-center justify-center gap-1">
              <span className="font-bold">Opponent</span>
            </div>
          </div>

          {/* opponent remaining time */}
          <span className="text-center font-[consolas] font-bold text-2xl">10:00</span>
        </div>

        {/* board */}
        <div className="flex-none p-3 rounded-md bg-surface border border-surface-hover flex items-center justify-center">
          <Board fenString={fenString} className="h-full max-h-[70vh] md:max-h-none aspect-square" />
        </div>

        {/* self details */}
        <div className="flex flex-row justify-between gap-3 w-full h-fit p-3 bg-surface border border-surface-hover rounded-md">
          <Link className="flex flex-row gap-3 items-center justify-center" to={`/user/${username}`}>
            {/* self profile pic */}
            <div className="w-8 h-8 rounded-full bg-white"></div>

            {/* self name & rating */}
            <div className="flex flex-row items-center justify-center gap-1">
              <span className="font-bold">{username}</span>
              <span className="font-[consolas] px-2 bg-surface-hover rounded text-sm">{selfData?.elo}</span>
            </div>
          </Link>

          {/* self remaining time */}
          <span className="text-center font-[consolas] font-bold text-2xl">10:00</span>
        </div>
      </div>

      {/* right panel */}
      <div className="flex flex-col min-w-60 w-full h-[calc(100vh-24px)] bg-surface border border-surface-hover rounded-md overflow-hidden">
        {/* header */}
        <div className="p-4 bg-background/40 font-bold text-text-strong border-b border-surface-hover lg:rounded-t-md">
          Matchmaking
        </div>

        {/* content */}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-6">
            {state === "idle" ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="w-16 h-16 rounded-full bg-surface-hover border border-surface-hover flex items-center justify-center text-primary animate-bounce duration-1000">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text-strong">Ready to Play?</h3>
                  <p className="text-sm text-text-weak max-w-xs mx-auto">Queue up to find an opponent</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="relative flex items-center justify-center my-4">
                  {/* Radar animation circles */}
                  <div className="absolute w-28 h-28 rounded-full border border-primary/20 animate-ping duration-1000" />
                  <div className="absolute w-20 h-20 rounded-full border border-primary/40 animate-ping duration-1500" />
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary z-10">
                    <Search className="w-8 h-8 animate-pulse text-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text-strong">Searching...</h3>
                  <p className="text-sm text-text-weak max-w-xs mx-auto">Looking for a matching opponent</p>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-surface-hover flex flex-row gap-3">
            <Button isLoading={state === "searching"} onClick={() => handleFindMatch()} className="w-full py-5 text-sm font-bold">
              {state === "idle" ? "Find Match" : "Searching for Game..."}
            </Button>
            {state === "searching" && (
              <Button onClick={() => handleCancelSearch()} className="w-full py-5 text-sm font-bold">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
