import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { SERVER_URL } from "../../supabaseClient";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Play, Square, Triangle, Circle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type GameState = "idle" | "playing" | "gameOver";

const SHAPES = [
  { id: "square", icon: <Square size={48} className="text-blue-500" />, name: "Square" },
  { id: "triangle", icon: <Triangle size={48} className="text-emerald-500" />, name: "Triangle" },
  { id: "circle", icon: <Circle size={48} className="text-rose-500" />, name: "Circle" },
  { id: "plus", icon: <Plus size={48} className="text-amber-500" />, name: "Plus" }
];

export default function ShapeMatchGame() {
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSaving, setIsSaving] = useState(false);
  
  const [topRow, setTopRow] = useState<typeof SHAPES>([]);
  const [bottomRow, setBottomRow] = useState<typeof SHAPES>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");

  const generateLevel = useCallback(() => {
    // Shuffle shapes for top row
    const shuffledTop = [...SHAPES].sort(() => Math.random() - 0.5);
    setTopRow(shuffledTop);

    // Shuffle again for bottom row
    const shuffledBottom = [...SHAPES].sort(() => Math.random() - 0.5);
    setBottomRow(shuffledBottom);

    // Calculate correct mapping (1-based index)
    // For each shape in bottom row, find its 1-based index in top row
    const mapping = shuffledBottom.map(bottomShape => {
      return shuffledTop.findIndex(topShape => topShape.id === bottomShape.id) + 1;
    });
    
    const correctMapStr = mapping.join("");
    setCorrectAnswer(correctMapStr);

    // Generate wrong options
    const newOptions = new Set<string>();
    newOptions.add(correctMapStr);
    
    while(newOptions.size < 4) {
      const randomOption = [1, 2, 3, 4].sort(() => Math.random() - 0.5).join("");
      newOptions.add(randomOption);
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
      // Give a little time bonus
      setTimeLeft(t => Math.min(t + 2, 60));
      generateLevel();
    } else {
      // Penalty for wrong answer
      setTimeLeft(t => Math.max(t - 5, 0));
      toast.error("Incorrect mapping! -5s penalty");
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
          gameId: "shape-match",
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
            <h1 className="text-3xl font-bold text-slate-900">Shape Order Match</h1>
            <p className="text-slate-500 mt-1">Map the bottom shapes to their positions in the top row.</p>
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
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Play size={40} className="ml-2" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">How fast can you match?</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Look at the top row of shapes (positions 1, 2, 3, 4). Then look at the bottom row and select the option that correctly maps them to their original positions.
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
            <div className="w-full max-w-2xl mx-auto">
              {/* Game Area */}
              <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-200">
                
                {/* Top Row */}
                <div className="mb-8">
                  <div className="text-sm font-bold text-slate-400 text-center mb-4 uppercase tracking-widest">Reference Row</div>
                  <div className="flex justify-center gap-4 sm:gap-8">
                    {topRow.map((shape, idx) => (
                      <div key={`top-${idx}`} className="flex flex-col items-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-3">
                          {shape.icon}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full h-px bg-slate-200 my-6"></div>

                {/* Bottom Row */}
                <div>
                  <div className="text-sm font-bold text-slate-400 text-center mb-4 uppercase tracking-widest">Target Row</div>
                  <div className="flex justify-center gap-4 sm:gap-8">
                    {bottomRow.map((shape, idx) => (
                      <div key={`bottom-${idx}`} className="flex flex-col items-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                          {shape.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Options Area */}
              <div className="grid grid-cols-2 gap-4">
                {options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(opt)}
                    className="py-4 px-6 bg-white border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl font-mono text-2xl font-bold tracking-[0.2em] text-slate-800 transition-colors"
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