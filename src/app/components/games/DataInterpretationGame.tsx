import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { SERVER_URL } from "../../supabaseClient";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Play, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type GameState = "idle" | "playing" | "gameOver";

type Question = {
  text: string;
  options: string[];
  answer: string;
};

export default function DataInterpretationGame() {
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isSaving, setIsSaving] = useState(false);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);

  const generateLevel = useCallback(() => {
    // Generate some random sales data
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    let data = [];
    let maxSales = 0;
    let minSales = 1000;
    let maxMonth = "";
    let minMonth = "";
    let totalSales = 0;

    for (let i = 0; i < months.length; i++) {
      const sales = Math.floor(Math.random() * 40) + 10; // 10 to 50
      data.push({ name: months[i], sales });
      totalSales += sales;
      if (sales > maxSales) { maxSales = sales; maxMonth = months[i]; }
      if (sales < minSales) { minSales = sales; minMonth = months[i]; }
    }
    
    setChartData(data);

    // Create a random question based on data
    const qTypes = ["highest", "lowest", "total", "difference"];
    const type = qTypes[Math.floor(Math.random() * qTypes.length)];
    
    let qText = "";
    let ans = "";
    let opts = new Set<string>();

    if (type === "highest") {
      qText = "Which month had the highest sales?";
      ans = maxMonth;
      opts.add(ans);
      while(opts.size < 4) { opts.add(months[Math.floor(Math.random() * months.length)]); }
    } else if (type === "lowest") {
      qText = "Which month had the lowest sales?";
      ans = minMonth;
      opts.add(ans);
      while(opts.size < 4) { opts.add(months[Math.floor(Math.random() * months.length)]); }
    } else if (type === "total") {
      qText = "What were the total sales across all 5 months?";
      ans = totalSales.toString();
      opts.add(ans);
      while(opts.size < 4) {
        opts.add((totalSales + Math.floor(Math.random() * 20) - 10).toString());
      }
    } else if (type === "difference") {
      qText = `What is the difference in sales between the highest and lowest months?`;
      const diff = maxSales - minSales;
      ans = diff.toString();
      opts.add(ans);
      while(opts.size < 4) {
        opts.add((diff + Math.floor(Math.random() * 10) - 5).toString());
      }
    }
    
    setQuestion({
      text: qText,
      answer: ans,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    });
    
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
    setTimeLeft(90);
    setGameState("playing");
    generateLevel();
  };

  const handleOptionSelect = (option: string) => {
    if (!question) return;
    if (option === question.answer) {
      setScore(s => s + 120 + (level * 15));
      setLevel(l => l + 1);
      setTimeLeft(t => Math.min(t + 5, 90));
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
          gameId: "data-interpretation",
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
            <h1 className="text-3xl font-bold text-slate-900">Data Interpretation</h1>
            <p className="text-slate-500 mt-1">Analyze the chart quickly and answer correctly.</p>
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
              <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 text-cyan-600">
                <BarChart3 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Fast Data Reading</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                You will be presented with a chart and a related question. Read the data quickly and select the correct answer.
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
              {/* Chart Area */}
              <div className="w-full bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                <h3 className="text-center font-bold text-slate-700 mb-4">Monthly Sales (in Thousands)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="sales" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Question Area */}
              {question && (
                <div className="w-full">
                  <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">{question.text}</h3>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {question.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOptionSelect(opt)}
                        className="py-4 px-6 bg-white border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 rounded-xl text-xl font-bold text-slate-800 transition-colors shadow-sm"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}