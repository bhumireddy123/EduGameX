import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { SERVER_URL } from "../../supabaseClient";
import { toast } from "sonner";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

type GameState = "idle" | "memorize" | "recall" | "gameOver";

export default function MemoryGame() {
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gridSize, setGridSize] = useState(3);
  const [activeTiles, setActiveTiles] = useState<number[]>([]);
  const [userTiles, setUserTiles] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const totalTiles = gridSize * gridSize;
  const tilesToMemorize = Math.min(Math.floor(level + 2), Math.floor(totalTiles * 0.6));

  const generateLevel = useCallback(() => {
    // Generate random tiles
    const newActive = new Set<number>();
    while (newActive.size < tilesToMemorize) {
      newActive.add(Math.floor(Math.random() * totalTiles));
    }
    setActiveTiles(Array.from(newActive));
    setUserTiles([]);
    setGameState("memorize");

    // Hide after 1.5 seconds + 0.2s per level
    setTimeout(() => {
      setGameState("recall");
    }, 1500 + (level * 150));
  }, [level, totalTiles, tilesToMemorize]);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setGridSize(3);
    generateLevel();
  };

  useEffect(() => {
    if (gameState === "idle" && level > 1) {
      generateLevel();
    }
  }, [gameState, level, generateLevel]);

  const handleTileClick = (index: number) => {
    if (gameState !== "recall") return;
    if (userTiles.includes(index)) return;

    const newUserTiles = [...userTiles, index];
    setUserTiles(newUserTiles);

    // Check if wrong
    if (!activeTiles.includes(index)) {
      endGame();
      return;
    }

    // Check if level complete
    if (newUserTiles.length === activeTiles.length) {
      setScore(s => s + (level * 100));
      setTimeout(() => {
        if (level % 3 === 0 && gridSize < 6) {
          setGridSize(s => s + 1);
        }
        setLevel(l => l + 1);
        setGameState("idle");
      }, 500);
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
          gameId: "memory",
          score,
          details: { level }
        })
      });
      if (res.ok) {
        toast.success("Score saved!");
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
            <h1 className="text-3xl font-bold text-slate-900">Memory Pattern</h1>
            <p className="text-slate-500 mt-1">Memorize the highlighted blocks.</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-500">Score</div>
            <div className="text-3xl font-extrabold text-indigo-600">{score}</div>
            <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md mt-1 inline-block">Level {level}</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {gameState === "idle" && level === 1 ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <RotateCcw size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to test your memory?</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">Pay close attention to the tiles that light up. When they disappear, click the exact same tiles.</p>
              <button 
                onClick={startGame}
                className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
              >
                Start Game
              </button>
            </div>
          ) : gameState === "gameOver" ? (
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Game Over</h2>
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
            <div className="w-full max-w-md mx-auto">
              <div className="mb-6 text-center text-lg font-bold min-h-[28px]">
                {gameState === "memorize" ? (
                  <span className="text-indigo-600 animate-pulse">Memorize the pattern...</span>
                ) : (
                  <span className="text-emerald-600">Repeat the pattern!</span>
                )}
              </div>
              
              <div 
                className="grid gap-2 p-2 bg-slate-100 rounded-2xl mx-auto w-full aspect-square"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: totalTiles }).map((_, idx) => {
                  const isActive = gameState === "memorize" && activeTiles.includes(idx);
                  const isCorrect = gameState === "recall" && userTiles.includes(idx) && activeTiles.includes(idx);
                  const isWrong = gameState === "recall" && userTiles.includes(idx) && !activeTiles.includes(idx);
                  
                  return (
                    <motion.button
                      key={idx}
                      whileTap={gameState === "recall" ? { scale: 0.95 } : {}}
                      onClick={() => handleTileClick(idx)}
                      disabled={gameState !== "recall"}
                      className={`rounded-xl shadow-sm transition-colors duration-200 ${
                        isActive ? "bg-indigo-500 shadow-indigo-200" :
                        isCorrect ? "bg-emerald-500 shadow-emerald-200" :
                        isWrong ? "bg-red-500 shadow-red-200" :
                        "bg-white hover:bg-slate-50"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
