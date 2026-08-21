import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swords, Trophy, RefreshCw, ArrowRight, TrendingUp, Bot } from "lucide-react";

import { useAuthContext } from "../context/AuthContext";
import { useApiContext } from "../context/ApiContext";
import Logger from "../services/logger.js";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import GameCard from "../components/GameCard.jsx";

const HomePage = () => {
  const { backendUrl, username } = useAuthContext();
  const { fetchApi } = useApiContext();

  const [recentGames, setRecentGames] = useState([]);
  const [stats, setStats] = useState({ total_games: 0, wins: 0, losses: 0, draws: 0, elo: 500 });
  const [loadingGames, setLoadingGames] = useState(true);

  const fetchRecentGames = async () => {
    const [success, data] = await fetchApi(`${backendUrl}/game/recent`, "GET", null, setLoadingGames);
    if (!success) {
      Logger.error("Failed to fetch recent games", data);
      return;
    }
    setRecentGames(data.games || []);
    if (data.stats) {
      setStats(data.stats);
    }
  };

  useEffect(() => {
    fetchRecentGames();
  }, []);

  const winPercent = stats.total_games > 0 ? (stats.wins / stats.total_games) * 100 : 0;
  const lossPercent = stats.total_games > 0 ? (stats.losses / stats.total_games) * 100 : 0;
  const drawPercent = stats.total_games > 0 ? (stats.draws / stats.total_games) * 100 : 0;
  const winRate = stats.total_games > 0 ? Math.round((stats.wins / stats.total_games) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 flex flex-col gap-7 lg:gap-4">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden bg-surface border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-strong tracking-tight">
            👋 Welcome back, <span className="text-primary">{username}</span>!
          </h1>
          <p className="text-text-weak font-medium max-w-lg">
            Challenge opponents worldwide, improve your ELO rating, and master your strategies.
          </p>
        </div>
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <Button variant="outline" onClick={fetchRecentGames} className="flex flex-row gap-2 p-3 rounded-xl text-text">
            <span>Reload</span>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="flex flex-col-reverse lg:flex-col lg:flex-row gap-7 lg:gap-4">
        {/* Left Side: Recent Games */}
        <div className="lg:flex-4 flex flex-col gap-4">
          <div className="lg:hidden flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-strong flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span>Recent Games</span>
            </h2>
          </div>

          {loadingGames ? (
            <div className="flex flex-col items-center justify-center p-12 bg-surface border border-slate-800 rounded-2xl min-h-[300px]">
              <Loader size="lg" className="text-primary" />
              <p className="text-text-weak text-sm mt-4 font-semibold">Loading recent games...</p>
            </div>
          ) : recentGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-surface/30 border border-slate-800/80 border-dashed rounded-2xl min-h-[300px] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface border border-slate-800 flex items-center justify-center text-text-weak">
                <Swords className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-text-strong">No games played yet</h3>
                <p className="text-sm text-text-weak max-w-xs mx-auto">
                  Queue up in Matchmaking to start your LetsChess journey!
                </p>
              </div>
              <Link to="/find-game">
                <Button variant="primary" className="px-6">
                  Find Match
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Play & Stats */}
        <div className="lg:flex-2 flex flex-col gap-7 lg:gap-4">
          {/* Play vs Bot Card */}
          <div
            className="overflow-hidden rounded-2xl p-6 flex flex-col justify-between gap-1
              bg-surface border border-surface-hover"
          >
            <div className="flex flex-row gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-text-strong">Play vs Bot</h3>
                <p className="text-sm text-text-weak font-medium">Practice instantly against a chess bot.</p>
              </div>
            </div>
            <Link to="/game/vs-bot" className="mt-6">
              <Button variant="primary" className="w-full py-4 text-base font-bold">
                <span>Play vs Bot</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Play Card */}
          <div
            className="overflow-hidden rounded-2xl p-6 flex flex-col justify-between gap-1
              bg-surface border border-surface-hover"
          >
            <div className="flex flex-row gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Swords className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-text-strong">Online Matchmaking</h3>
                <p className="text-sm text-text-weak font-medium">Queue up now to find and opponent.</p>
              </div>
            </div>
            <Link to="/find-game" className="mt-6">
              <Button variant="primary" className="w-full py-4 text-base font-bold">
                <span>Find Match</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-text-weak/50 text-center mt-2">
              You'll be matched with real players — this may take some time.
            </p>
          </div>

          {/* Stats Card */}
          <div
            className="overflow-hidden rounded-2xl p-6 flex flex-col gap-6 justify-between
              bg-surface border border-surface-hover"
          >
            <div className="flex flex-row gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-strong">Career Stats</h3>
            </div>

            {/* ELO Display */}
            <div className="bg-background/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-text-weak font-bold uppercase tracking-wider">Rating</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-black text-text-strong font-[consolas]">{stats.elo}</span>
                  <span className="text-xs text-primary font-bold">ELO</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/15">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* Stats Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-background/40 rounded-xl border border-slate-800">
                <span className="block text-xs text-text-weak font-semibold">Played</span>
                <span className="text-xl font-bold text-text-strong">{stats.total_games}</span>
              </div>
              <div className="p-3 bg-background/40 rounded-xl border border-slate-800">
                <span className="block text-xs text-text-weak font-semibold">Win Rate</span>
                <span className="text-xl font-bold text-text-strong">{winRate}%</span>
              </div>
            </div>

            {/* Segmented win/loss bar */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-text-weak font-bold">
                <span>Record</span>
                <span>
                  <span className="text-green-500">{stats.wins}W</span> - {stats.draws}D -{" "}
                  <span className="text-red-500">{stats.losses}L</span>
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-800 flex">
                {stats.wins > 0 && (
                  <div
                    style={{ width: `${winPercent}%` }}
                    className="h-full bg-green-500 transition-all duration-500"
                    title={`Wins: ${Math.round(winPercent)}%`}
                  />
                )}
                {stats.draws > 0 && (
                  <div
                    style={{ width: `${drawPercent}%` }}
                    className="h-full bg-slate-500 transition-all duration-500"
                    title={`Draws: ${Math.round(drawPercent)}%`}
                  />
                )}
                {stats.losses > 0 && (
                  <div
                    style={{ width: `${lossPercent}%` }}
                    className="h-full bg-red-500 transition-all duration-500"
                    title={`Losses: ${Math.round(lossPercent)}%`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
