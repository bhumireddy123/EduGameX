import React, { useEffect, useState } from "react";
import { SERVER_URL } from "../supabaseClient";
import { Trophy, Medal, LayoutGrid, Zap, Shapes, Target, Brain, BarChart3 } from "lucide-react";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("memory");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/leaderboard/${activeTab}`);
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <Trophy className="text-amber-500" size={40} /> Global Leaderboard
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          See how you stack up against other candidates preparing for MNC assessments.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("memory")}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${activeTab === "memory" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <LayoutGrid size={20} className="hidden sm:block" /> <span className="text-sm sm:text-base">Memory</span>
          </button>
          <button
            onClick={() => setActiveTab("reaction")}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${activeTab === "reaction" ? "bg-amber-50 text-amber-700 border-b-2 border-amber-500" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Zap size={20} className="hidden sm:block" /> <span className="text-sm sm:text-base">Reaction</span>
          </button>
          <button
            onClick={() => setActiveTab("shape-match")}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${activeTab === "shape-match" ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Shapes size={20} className="hidden sm:block" /> <span className="text-sm sm:text-base">Shapes</span>
          </button>
          <button
            onClick={() => setActiveTab("triangle-puzzle")}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${activeTab === "triangle-puzzle" ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Target size={20} className="hidden sm:block" /> <span className="text-sm sm:text-base">Triangle</span>
          </button>
          <button
            onClick={() => setActiveTab("logical-deduction")}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${activeTab === "logical-deduction" ? "bg-rose-50 text-rose-700 border-b-2 border-rose-500" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Brain size={20} className="hidden sm:block" /> <span className="text-sm sm:text-base">Logic</span>
          </button>
          <button
            onClick={() => setActiveTab("data-interpretation")}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${activeTab === "data-interpretation" ? "bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <BarChart3 size={20} className="hidden sm:block" /> <span className="text-sm sm:text-base">Data</span>
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Loading rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">No scores yet. Be the first to play!</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {leaderboard.map((entry, index) => (
                <li key={index} className="flex items-center p-6 hover:bg-slate-50 transition">
                  <div className="w-12 text-center font-extrabold text-lg mr-4">
                    {index === 0 ? <Medal className="mx-auto text-yellow-500" size={28} /> :
                     index === 1 ? <Medal className="mx-auto text-slate-400" size={28} /> :
                     index === 2 ? <Medal className="mx-auto text-amber-600" size={28} /> :
                     <span className="text-slate-400">#{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">{entry.userName || "Anonymous"}</h3>
                    <p className="text-sm text-slate-500">{new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-2xl text-indigo-600">{entry.score}</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Points</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
