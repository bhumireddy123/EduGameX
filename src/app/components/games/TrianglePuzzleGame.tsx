import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { SERVER_URL } from "../../supabaseClient";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Play, Divide, X, Plus, Minus } from "lucide-react";
import { motion } from "motion/react";

type GameState = "idle" | "playing" | "gameOver";

export default function TrianglePuzzleGame() {
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isSaving, setIsSaving] = useState(false);
  
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [center, setCenter] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);

  const generateLevel = useCallback(() => {
    // Logic: (a * b) + c = center
    // We will generate random numbers and let the user figure it out.
    // For simplicity, a and b are top, c is bottom.
    
    // Difficulty scaling
    const maxVal = level * 2 + 5;
    
    const newA = Math.floor(Math.random() * maxVal) + 1;
    const newB = Math.floor(Math.random() * maxVal) + 1;
    const newC = Math.floor(Math.random() * (maxVal * 2)) + 1;
    
    const newCenter = (newA * newB) + newC;
    
    setA(newA);
    setB(newB);
    setC(newC);
    setCenter(newCenter);
    
    setCorrectAnswer(newCenter);

    // Generate wrong options
    const newOptions = new Set<number>();
    newOptions.add(newCenter);
    
    while(newOptions.size < 4) {
      const variance = Math.floor(Math.random() * 10) - 5;
      const randomOption = newCenter + variance;
      if (randomOption > 0 && randomOption !== newCenter) {
        newOptions.add(randomOption);
      }
    }
    
    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
  }, [level]);

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
    setTimeLeft(90);
    setGameState("playing");
    generateLevel();
  };

  const handleOptionSelect = (option: number) => {
    if (option === correctAnswer) {
      setScore(s => s + 150 + (level * 20));
      setLevel(l => l + 1);
      setTimeLeft(t => Math.min(t + 3, 90));
      generateLevel();
    } else {
      setTimeLeft(t => Math.max(t - 10, 0));
      toast.error("Incorrect! -10s penalty");
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
          gameId: "triangle-puzzle",
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
            <h1 className="text-3xl font-bold text-slate-900">Missing Number Triangle</h1>
            <p className="text-slate-500 mt-1">Deduce the pattern and find the missing center number.</p>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-sm font-medium text-slate-500">Time</div>
              <div className={`text-2xl font-extrabold ${timeLeft <= 15 && gameState === "playing" ? "text-red-500 animate-pulse" : "text-slate-700"}`}>
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
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Play size={40} className="ml-2" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Numerical Logic Challenge</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Observe the three outer numbers of the triangle. They relate to the center number through a mathematical pattern. Find the pattern and choose the correct center number.
              </p>
              <button 
                onClick={startGame}
                className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
              >
                Start Game (90s)
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
              {/* Triangle Puzzle Visualization */}
              <div className="relative w-80 h-80 mb-12 flex items-center justify-center">
                {/* Visual Triangle Shape (CSS Border approach) */}
                <div className="absolute inset-0 w-full h-full pb-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md text-slate-100 fill-current">
                    <polygon points="50,10 95,90 5,90" stroke="currentColor" strokeWidth="2" className="text-slate-300" />
                  </svg>
                </div>
                
                {/* Top Number */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white w-14 h-14 rounded-full shadow-lg border-2 border-indigo-100 flex items-center justify-center text-xl font-bold text-slate-800 z-10">
                  {a}
                </div>
                
                {/* Bottom Right Number */}
                <div className="absolute bottom-10 right-4 bg-white w-14 h-14 rounded-full shadow-lg border-2 border-indigo-100 flex items-center justify-center text-xl font-bold text-slate-800 z-10">
                  {b}
                </div>
                
                {/* Bottom Left Number */}
                <div className="absolute bottom-10 left-4 bg-white w-14 h-14 rounded-full shadow-lg border-2 border-indigo-100 flex items-center justify-center text-xl font-bold text-slate-800 z-10">
                  {c}
                </div>
                
                {/* Center Question Mark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4 bg-indigo-600 w-16 h-16 rounded-full shadow-lg border-4 border-indigo-200 flex items-center justify-center text-2xl font-black text-white z-10 animate-pulse">
                  ?
                </div>
              </div>

              {/* Options Area */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
                {options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOptionSelect(opt)}
                    className="py-4 px-6 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl text-xl font-bold text-slate-800 transition-colors shadow-sm"
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