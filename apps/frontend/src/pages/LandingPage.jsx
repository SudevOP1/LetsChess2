import { Link } from "react-router-dom";
import { Zap, Trophy, Eye, Sparkles, ListTodo, UserRound, Search, ChessQueen } from "lucide-react";
import { Chess } from "chess.js";

import Button from "../components/ui/Button";
import Board from "../components/Board";
import { useEffect, useState, useMemo } from "react";

const LandingPage = () => {
  const demoGameMoves =
    "e4 c5 Nf3 d6 Bb5+ Bd7 Bxd7+ Nxd7 O-O e6 Re1 Be7 c3 Ngf6 d4 O-O e5 Ne8 exd6 Nxd6 d5 exd5 Qxd5 Nf6 Qxc5 Nde4 Qf5 g6 Qf4 Bd6 Qh4 Bc5 Be3 Bxe3 Rxe3 Qd1+ Re1 Qc2 Na3 Qxb2 Nc4 Qxc3 Rac1 Qb4 Rxe4 Nxe4 Qxe4 Rac8 a3 Qa4 Qc2 Qa6 a4 Rfd8 h4 b5 axb5 Qxb5 Qe4 Re8 Qf4 a5 Nd6 Rxc1+ Qxc1 Qd7 Nxe8 Qxe8 Qe1 Qa8 Qa1 a4 Qa3 Qe4 h5 gxh5 Qc5 h6 Qe3 Qxe3 fxe3 a3 Nd4 a2 Nb3 Kg7 Kf2 Kf6 Kf3 Kf5 g3 Kg5 e4 Kf6 Kf4 Ke6 Nd4+ Kf6 Nc2 Kg6 e5 Kh7 Kf5 Kg7 Na1 Kg8 Kf6 Kf8 Kf5 Ke7 Nb3 Ke8 Kf6 Kf8 Na1 Kg8 Ke7 Kg7 Ke8 Kg6 Ke7 Kg7 Ke8 f5 e6 Kf6 e7 h4 gxh4 Ke5 Kd7 f4 e8=Q+ Kf5 Qf7+ Kg4 h5 f3 Qg6+ Kf4 Qxh6+ Kg4 Qg6+ Kf4 h6 f2 Qf6+ Ke3 h7 f1=Q h8=Q Ke4 Qxf1 Kd5 0-1";

  const gameHistory = useMemo(() => {
    const game = new Chess();
    const history = [
      {
        fen: game.fen(),
        uciMoves: [],
        isCheck: game.inCheck(),
        turn: game.turn(),
      },
    ];

    const moves = demoGameMoves
      .split(" ")
      .filter((move) => move && move !== "0-1" && move !== "1-0" && move !== "1/2-1/2" && move !== "*");
    const uciList = [];

    for (let move of moves) {
      try {
        const res = game.move(move);
        if (res) {
          uciList.push(res.from + res.to);
          history.push({
            fen: game.fen(),
            uciMoves: [...uciList],
            isCheck: game.inCheck(),
            turn: game.turn(),
          });
        }
      } catch (e) {
        console.error("Invalid move in demo:", move, e);
      }
    }
    return history;
  }, []);

  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  useEffect(() => {
    const isEnd = currentMoveIndex >= gameHistory.length - 1;
    const delay = isEnd ? 4000 : 700; // Stay at the final state for 4 seconds before restarting

    const timer = setTimeout(() => {
      if (isEnd) {
        setCurrentMoveIndex(0);
      } else {
        setCurrentMoveIndex((prev) => prev + 1);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentMoveIndex, gameHistory.length]);

  const currentMove = gameHistory[currentMoveIndex] || {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    uciMoves: [],
  };

  const features = [
    {
      icon: Zap,
      title: "Moves sync instantly",
      body: "Your move updates instantly. No refresh button, no lag between you and the board.",
    },
    {
      icon: Trophy,
      title: "Rated matchmaking",
      body: "Skill-based matchmaking. Get paired with players your level, every time you queue up.",
    },
    {
      icon: Eye,
      title: "Watch any game live",
      body: "Drop into an in-progress match as a spectator and follow in real time.",
    },
  ];

  const steps = [
    { icon: UserRound, title: "Create an account", body: "Takes a few seconds. No email verification hoops." },
    { icon: Search, title: "Find a match", body: "Queue up and get paired with an opponent near your rating." },
    { icon: ChessQueen, title: "Make your move", body: "Play it out on the board. The clock and your opponent are both real." },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* hero */}
      <section className="mx-auto w-full max-w-6xl px-10 pt-16 pb-20 lg:pt-24 lg:pb-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 flex flex-col items-start gap-6 text-center lg:text-left w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-strong font-bold mx-auto lg:mx-0">
            Play <span className="text-primary">Chess Online</span>
          </h1>
          <p className="text-lg text-text max-w-md mx-auto lg:mx-0 font-semibold">
            No bots pretending to be people. Just you and an opponent on the board.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full">
                Play now
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                Log in
              </Button>
            </Link>
          </div>
        </div>

        {/* live board */}
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div className="p-3 rounded-md bg-surface border border-surface-hover">
            <Board
              fenString={currentMove.fen}
              uciMoves={currentMove.uciMoves}
              isCheck={currentMove.isCheck}
              turn={currentMove.turn}
              isGameOver={true}
              className="aspect-square w-full"
            />
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-y border-surface-hover bg-surface/40 py-36 flex flex-col gap-24 items-center justify-center">
        <h2 className="flex flex-row gap-6 items-center justify-center text-text-strong">
          <Sparkles className="w-12 h-12 text-primary" />
          <span className="text-2xl md:text-5xl font-semibold">Exciting Features</span>
        </h2>
        <div className="mx-auto w-full max-w-6xl px-10 flex flex-col md:flex-row gap-4 md:gap-8">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex-1 flex flex-col items-start gap-3">
              <div className="p-2.5 rounded-lg bg-surface border border-surface-hover">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text-strong">{title}</h3>
              <p className="text-text-weak">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="py-36 flex flex-col gap-24 items-center justify-center">
        <h2 className="flex flex-row gap-6 items-center justify-center text-text-strong">
          <ListTodo className="w-12 h-12 text-primary" />
          <span className="text-2xl md:text-5xl font-semibold">How it works</span>
        </h2>
        <div className="mx-auto w-full max-w-6xl px-10 flex flex-col md:flex-row gap-4 md:gap-8">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex-1 flex flex-col items-start gap-3">
              <div className="p-2.5 rounded-lg bg-surface border border-surface-hover">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text-strong">{title}</h3>
              <p className="text-text-weak">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* final cta */}
      <section className="bg-surface/40 border-t border-surface-hover py-16 md:py-36 px-4 md:px-10 flex flex-col items-center justify-center">
        <div
          className="border border-surface-hover bg-background rounded-lg mx-auto w-full max-w-5xl
            flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-between px-6 py-8 md:px-12 md:py-10 lg:px-20 lg:py-15"
        >
          <div className="flex flex-col gap-3 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-text-strong">
              Your first game is one click away.
            </h2>
            <p className="text-text-weak">Sign up now to join the community and start playing.</p>
          </div>
          <Link to="/signup" className="w-full md:w-auto md:shrink-0">
            <Button variant="primary" className="w-full md:w-auto px-8 py-4 md:px-12 text-lg md:text-xl">
              Sign up
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
