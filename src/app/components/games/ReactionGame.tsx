import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { SERVER_URL } from "../../supabaseClient";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Zap } from "lucide-react";
import { Link } from "react-router";

type GameState = "idle" | "waiting" | "ready" | "gameOver";

export default function ReactionGame() {
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startGame = () => {
    setGameState("waiting");
    setMessage("Wait for green...");
    setReactionTime(null);
    
    // Random delay between 2 and 6 seconds
    const delay = Math.random() * 4000 + 2000;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setGameState("ready");
      setMessage("CLICK NOW!");
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === "idle" || gameState === "gameOver") return;

    if (gameState === "waiting") {
      // Too early
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState("gameOver");
      setMessage("Too early! You clicked before green.");
      setScore(0);
      saveScore(0);
    } else if (gameState === "ready") {
      // Good click
      const endTime = performance.now();
      const time = Math.round(endTime - startTimeRef.current);
      setReactionTime(time);
      
      // Calculate score based on speed (max 1000, drops off)
      const calculatedScore = Math.max(0, 1000 - time);
      setScore(calculatedScore);
      setGameState("gameOver");
      
      if (time < 200) setMessage("Lightning fast! ⚡");
      else if (time < 300) setMessage("Great reflex!");
      else if (time < 400) setMessage("Good speed.");
      else setMessage("You can do better!");

      saveScore(calculatedScore);
    }
  };

  const saveScore = async (finalScore: number) => {
    if (!session || finalScore === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          gameId: "reaction",
          score: finalScore,
          details: { reactionTime: reactionTime }
        })
      });
      if (!res.ok) throw new Error("Failed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save score");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
      <Link to="/games" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Games
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reaction Speed</h1>
            <p className="text-slate-500 mt-1">Test your visual reflexes under pressure.</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-500">Score</div>
            <div className="text-3xl font-extrabold text-amber-500">{score}</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-[400px]">
          {gameState === "idle" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                <Zap size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reaction Time Test</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">When the red box turns green, click as quickly as you can. Clicking too early will result in 0 score.</p>
              <button 
                onClick={startGame}
                className="bg-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-600 transition shadow-md shadow-amber-200"
              >
                Start Game
              </button>
            </div>
          ) : (
            <div 
              onClick={handleClick}
              className={`flex-1 rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-colors duration-100 select-none
                ${gameState === "waiting" ? "bg-red-500" : 
                  gameState === "ready" ? "bg-emerald-500" : 
                  "bg-slate-100"}`}
            >
              <h2 className={`text-4xl font-extrabold mb-4 ${gameState === "gameOver" ? "text-slate-900" : "text-white"}`}>
                {message}
              </h2>
              
              {gameState === "gameOver" && (
                <div className="text-center">
                  {reactionTime && (
                    <div className="text-2xl font-bold text-slate-700 mb-6">
                      {reactionTime} ms
                    </div>
                  )}
                  {isSaving && <div className="text-sm text-slate-500 flex items-center justify-center mb-6"><Loader2 className="animate-spin mr-2" size={16} /> Saving score...</div>}
                  <button 
                    onClick={(e) => { e.stopPropagation(); startGame(); }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-md"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
