import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { SERVER_URL } from "../supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Target, TrendingUp, AlertCircle, Gamepad2 } from "lucide-react";

export default function Dashboard() {
  const { session } = useAuth();
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return; // ProtectedRoute handles redirect

    const fetchScores = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/scores`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.scores) {
          const sorted = [...data.scores].sort((a: any, b: any) => a.timestamp - b.timestamp);
          setScores(sorted);
        }
      } catch (err) {
        // Backend may be unavailable — show empty state gracefully
        console.warn("Score fetch failed (backend may be unavailable):", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [session]);

  if (!session) return null; // Guarded by ProtectedRoute

  const chartData = scores.slice(-10).map((s, i) => ({
    name: `Game ${i + 1}`,
    score: s.score,
    game: s.gameId
  }));

  const totalGames = scores.length;
  const avgScore = totalGames > 0 ? Math.round(scores.reduce((acc, curr) => acc + curr.score, 0) / totalGames) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {session.user.user_metadata?.name || 'Player'}!</h1>
        <p className="text-slate-600 mt-2">Track your progress and get ready for your MNC assessments.</p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Gamepad2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Games Played</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalGames}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Average Score</p>
                <h3 className="text-2xl font-bold text-slate-900">{avgScore}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Recent Peak</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {totalGames > 0 ? Math.max(...scores.map(s => s.score)) : 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-600"/> Recent Performance</h2>
              </div>
              {chartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle size={48} className="mb-4 opacity-50" />
                  <p>No game data available yet.</p>
                  <Link to="/games" className="mt-4 text-indigo-600 font-medium hover:underline">Play your first game</Link>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Your Profile</h2>
              <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Full Name</p>
                  <p className="font-medium text-slate-900">{session.user.user_metadata?.name || 'Player'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Email ID</p>
                  <p className="font-medium text-slate-900 break-all">{session.user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Year</p>
                    <p className="font-medium text-slate-900">{session.user.user_metadata?.education || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Stream</p>
                    <p className="font-medium text-slate-900">{session.user.user_metadata?.stream || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Start Actions</h2>
              <div className="space-y-4 flex-1">
                <Link to="/games/memory" className="block p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                  <h3 className="font-bold text-slate-900">Memory Pattern</h3>
                  <p className="text-sm text-slate-500 mt-1">Accenture specific memory grid game.</p>
                </Link>
                <Link to="/games/reaction" className="block p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition">
                  <h3 className="font-bold text-slate-900">Reaction Speed</h3>
                  <p className="text-sm text-slate-500 mt-1">Capgemini time-based focus test.</p>
                </Link>
                <Link to="/games/shape-match" className="block p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition">
                  <h3 className="font-bold text-slate-900">Shape Order Match</h3>
                  <p className="text-sm text-slate-500 mt-1">Visual processing and mapping game.</p>
                </Link>
                <Link to="/games/triangle-puzzle" className="block p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition">
                  <h3 className="font-bold text-slate-900">Missing Number Triangle</h3>
                  <p className="text-sm text-slate-500 mt-1">Cognizant numerical deduction puzzle.</p>
                </Link>
                <Link to="/games" className="block p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-center font-medium text-slate-700">
                  View All Games &rarr;
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
