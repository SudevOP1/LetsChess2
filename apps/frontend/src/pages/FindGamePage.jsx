import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Trophy, Clock, Shield, Users } from "lucide-react";

import { useAuthContext } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Board from "../components/Board";

const GamePage = () => {
  const { gameId } = useParams();
  const { username } = useAuthContext();
  const times = {
    Bullet: 1,
    Blitz: 3,
    Rapid: 5,
    Classical: 10,
  };

  const [selfRating, setSelfRating] = useState(69);
  const [selectedTime, setSelectedTime] = useState("Classical");
  const [state, setState] = useState("idle"); // idle, searching
  const fenString = "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4";

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
          <span className="text-center font-[consolas] font-bold text-2xl">{times[selectedTime]}:00</span>
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
              <span className="font-[consolas] px-2 bg-surface-hover rounded text-sm">{selfRating}</span>
            </div>
          </Link>

          {/* self remaining time */}
          <span className="text-center font-[consolas] font-bold text-2xl">{times[selectedTime]}:00</span>
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
                <div className="w-16 h-16 rounded-full bg-surface-hover border border-surface-hover flex items-center justify-center text-primary shadow-lg animate-bounce duration-1000">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text-strong">Ready to Play?</h3>
                  <p className="text-sm text-text-weak max-w-xs mx-auto">Queue up to find an opponent</p>
                </div>

                {/* game mode options (visual only) */}
                <div className="w-full space-y-2 text-left mt-4">
                  <span className="text-xs font-semibold text-text-weak uppercase tracking-wider">Time Control</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(times).map(([timeName, time]) => (
                      <Button
                        key={time}
                        size="custom"
                        variant="custom"
                        onClick={() => setSelectedTime(timeName)}
                        className={`p-2 flex-col hover:bg-primary/10 ${selectedTime === timeName ? "bg-primary/20" : "bg-background/40"}`}
                      >
                        <span className="text-[10px] text-text-weak uppercase tracking-wider font-semibold">{timeName}</span>
                        <span className="text-sm font-bold text-text-strong">{time} min</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* ELO Display */}
                <div className="flex items-center justify-between w-full p-3 bg-background/40 border border-surface-hover rounded-lg text-sm text-text">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Your Rating</span>
                  </div>
                  <span className="font-[consolas] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                    {selfRating} ELO
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="relative flex items-center justify-center my-4">
                  {/* Radar animation circles */}
                  <div className="absolute w-28 h-28 rounded-full border border-primary/20 animate-ping duration-1000" />
                  <div className="absolute w-20 h-20 rounded-full border border-primary/40 animate-ping duration-1500" />
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-lg z-10">
                    <Search className="w-8 h-8 animate-pulse text-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text-strong">Searching...</h3>
                  <p className="text-sm text-text-weak max-w-xs mx-auto">
                    Looking for a matching opponent around {selfRating} ELO.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-surface-hover">
            <Button className="w-full py-5 text-sm font-bold" disabled={state === "searching"} isLoading={state === "searching"}>
              {state === "idle" ? "Find Match" : "Searching for Game..."}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
