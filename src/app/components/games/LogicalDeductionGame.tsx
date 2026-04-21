import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { SERVER_URL } from "../../supabaseClient";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Play, Brain, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";

type GameState = "idle" | "playing" | "gameOver";

export default function LogicalDeductionGame() {
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSaving, setIsSaving] = useState(false);
  
  const [sequence, setSequence] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");

  const generateLevel = useCallback(() => {
    // Generate a simple letter or pattern sequence
    const types = ["alphabet", "pattern"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let newSequence: string[] = [];
    let correct: string = "";
    
    if (type === "alphabet") {
      // e.g. A, C, E, G -> ? (I)
      const startCharCode = 65 + Math.floor(Math.random() * 10);
      const step = Math.floor(Math.random() * 3) + 1;
      
      for(let i=0; i<4; i++) {
        newSequence.push(String.fromCharCode(startCharCode + (i * step)));
      }
      correct = String.fromCharCode(startCharCode + (4 * step));
    } else {
      // e.g. O, OO, OOO, OOOO -> ? (OOOOO)
      const symbols = ["*", "#", "@", "∆"];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      for(let i=1; i<=4; i++) {
        newSequence.push(symbol.repeat(i));
      }
      correct = symbol.repeat(5);
    }
    
    setSequence(newSequence);
    setCorrectAnswer(correct);

    const newOptions = new Set<string>();
    newOptions.add(correct);
    
    while(newOptions.size < 4) {
      if (type === "alphabet") {
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        newOptions.add(randomChar);
      } else {
        const symbols = ["*", "#", "@", "∆"];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const length = Math.floor(Math.random() * 6) + 1;
        newOptions.add(randomSymbol.repeat(length));
      }
    }
    
    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === "playing") {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setGameState("playing");
    generateLevel();
  };

  const handleOptionSelect = (option: string) => {
    if (option === correctAnswer) {
      setScore(s => s + 100 + (level * 10));
      setLevel(l => l + 1);
      setTimeLeft(t => Math.min(t + 2, 60));
      generateLevel();
    } else {
      setTimeLeft(t => Math.max(t - 5, 0));
      toast.error("Incorrect! -5s penalty");
    }
  };

  const endGame = async () => {
    setGameState("gameOver");
    if (!session || score === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          gameId: "logical-deduction",
          score,
          details: { level }
        })
      });
      if (res.ok) {
        toast.success("Score saved to leaderboard!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save score");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
      <Link to="/games" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Games
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Logical Deduction</h1>
            <p className="text-slate-500 mt-1">Determine the missing element in the sequence.</p>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-sm font-medium text-slate-500">Time</div>
              <div className={`text-2xl font-extrabold ${timeLeft <= 10 && gameState === "playing" ? "text-red-500 animate-pulse" : "text-slate-700"}`}>
                {timeLeft}s
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Score</div>
              <div className="text-3xl font-extrabold text-indigo-600">{score}</div>
              <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md mt-1 inline-block">Level {level}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {gameState === "idle" ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
                <Brain size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pattern Recognition</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Observe the sequence provided. Determine the logical rule that connects them and predict the next element in the series.
              </p>
              <button 
                onClick={startGame}
                className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
              >
                Start Game (60s)
              </button>
            </div>
          ) : gameState === "gameOver" ? (
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Time's Up!</h2>
              <p className="text-xl text-slate-600 mb-8">You reached Level {level} with a score of {score}.</p>
              
              {isSaving && <div className="text-sm text-indigo-600 flex items-center justify-center mb-6"><Loader2 className="animate-spin mr-2" size={16} /> Saving score...</div>}
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={startGame}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-md"
                >
                  Play Again
                </button>
                <Link 
                  to="/leaderboard"
                  className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-full font-bold hover:bg-slate-50 transition"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
              <div className="w-full bg-slate-50 rounded-2xl p-8 mb-10 border border-slate-200 text-center">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {sequence.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div className="h-16 px-6 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-800">
                        {item}
                      </div>
                      <span className="text-slate-400 font-bold text-xl">→</span>
                    </React.Fragment>
                  ))}
                  <div className="h-16 w-16 bg-rose-100 rounded-xl shadow-sm border-2 border-rose-300 flex items-center justify-center text-3xl font-bold text-rose-600 animate-pulse">
                    ?
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                {options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(opt)}
                    className="py-5 px-6 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl text-2xl font-bold text-slate-800 transition-colors shadow-sm"
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
