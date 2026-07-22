import { Link } from "react-router-dom";
import { Swords, Calendar, ArrowRight } from "lucide-react";

import { useAuthContext } from "../context/AuthContext";

const GameCard = ({ game }) => {
  const { userId } = useAuthContext();

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isPlayer1 = game.player1_id === userId;
  const opponentUsername = isPlayer1 ? game.player2_username : game.player1_username;
  const opponentElo = isPlayer1 ? game.player2_elo : game.player1_elo;
  const selfColor = isPlayer1 ? "w" : "b";
  const opponentColor = selfColor === "w" ? "b" : "w";
  const outcome = (() => {
    if (game.status === "gameover") {
      if (game.winner === selfColor) {
        return { title: "Victory", className: "bg-green-900/30 text-green-500" };
      }
      if (game.winner === opponentColor) {
        return { title: "Defeat", className: "bg-red-900/30 text-red-500" };
      }
      return { title: "Draw", className: "bg-yellow-900/30 text-yellow-500" };
    } else {
      return { title: "Active", className: "bg-green-900/30 text-green-500" };
    }
  })();

  return (
    <div className="relative">
      {outcome.title === "Active" && (
        <div className="absolute inset-0 animate-active-game rounded-xl bg-green-500/50 pointer-events-none z-0" />
      )}
      <Link
        key={game.id}
        to={`/game/${game.id}`}
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 md:p-5
          rounded-xl bg-surface hover:bg-surface-hover border cursor-pointer group relative z-[1]
          ${outcome.title === "Active" ? "border-green-600" : "border-surface-hover"}
        `}
      >
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Self color circle */}
          <div
            title={selfColor === "w" ? "Played as White" : "Played as Black"}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0
            ${selfColor === "w" ? "bg-white text-black border-slate-300" : "bg-black text-white border-slate-750"}`}
          >
            {selfColor === "w" ? "W" : "B"}
          </div>

          {/* Opponent info */}
          <div className="space-y-1 truncate">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-text-strong truncate">vs {opponentUsername}</span>
              <span className="font-[consolas] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-text-weak shrink-0">
                {opponentElo}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-weak">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(game.started_at)}
              </span>
              <span>•</span>
              <span>{game.moves_count} moves</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-2 items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {/* Result */}
          {game.status === "gameover" && ["Victory", "Defeat", "Draw"].includes(outcome.title) && (
            <span className={`px-5 py-2 mr-1 rounded-full text-sm font-bold ${outcome.className}`}>{outcome.title}</span>
          )}

          {/* arrow */}
          <div className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out shrink-0">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default GameCard;
