import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Ban, Flag, ArrowLeft, ArrowRight } from "lucide-react";

import { useAuthContext } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Board from "../components/Board";

const GamePage = () => {
  const { gameId } = useParams();
  const { username } = useAuthContext();

  const [oppUsername, setOppUsername] = useState("opponent");
  const [selfRating, setSelfRating] = useState(69);
  const [oppRating, setOppRating] = useState(67);
  const [oppTime, setOppTime] = useState("10:00");
  const [selfTime, setSelfTime] = useState("10:00");
  const [fenString, setFenString] = useState("r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4");
  const [sanMoves, setSanMoves] = useState("e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7");

  const getMoves = (sanMoves = "") => {
    if (!sanMoves || typeof sanMoves !== "string") return [];
    const moves = sanMoves.trim().split(/\s+/).filter(Boolean);
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      if (i + 1 < moves.length) {
        pairs.push([moves[i], moves[i + 1]]);
      } else {
        pairs.push([moves[i]]);
      }
    }
    return pairs;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-screen h-full min-h-screen p-3 md:max-w-4xl lg:max-w-6xl mx-auto">
      {/* left panel */}
      <div className="flex flex-col gap-4 h-full">
        {/* opponent details */}
        <div className="flex flex-row justify-between gap-3 w-full h-fit p-3 bg-surface border border-surface-hover rounded-md">
          <Link className="flex flex-row gap-3 items-center justify-center" to={`/user/${oppUsername}`}>
            {/* opponent profile pic */}
            <div className="w-8 h-8 rounded-full bg-white"></div>

            {/* opponent name & rating */}
            <div className="flex flex-row items-center justify-center gap-1">
              <span className="font-bold">{oppUsername}</span>
              <span className="font-[consolas] px-2 bg-surface-hover rounded text-sm">{oppRating}</span>
            </div>
          </Link>

          {/* opponent remaining time */}
          <span className="text-center font-[consolas] font-bold text-2xl">{oppTime}</span>
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
            {getMoves(sanMoves).map((nthMove, n) => (
              <div
                key={n}
                className={`flex flex-row justify-between px-2 py-1 w-full text-sm md:text-lg rounded
                ${n % 2 === 0 ? "bg-background/40" : ""}`}
              >
                <div
                  className={`flex-1
                  ${n === getMoves(sanMoves).length - 1 ? "text-text-strong font-semibold" : "text-text-weak"}`}
                >
                  {n + 1}.
                </div>
                <div
                  className={`flex-1 text-text
                  ${n === getMoves(sanMoves).length - 1 && "text-text-strong font-semibold"}`}
                >
                  {nthMove[0]}
                </div>
                <div
                  className={`flex-1 text-text
                  ${n === getMoves(sanMoves).length - 1 && "text-text-strong font-semibold"}`}
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
