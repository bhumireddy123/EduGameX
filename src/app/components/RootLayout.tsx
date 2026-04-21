import React from "react";
import { Outlet, Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { BrainCircuit, LogOut, User as UserIcon, LayoutDashboard, Gamepad2, Trophy, LineChart } from "lucide-react";

export default function RootLayout() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:opacity-80 transition">
            <BrainCircuit size={28} className="text-indigo-600" />
            <span className="text-xl font-bold tracking-tight">HireGame Prep</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">Features</Link>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">Login</Link>
                <Link to="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link to="/games" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  <Gamepad2 size={18} /> Games
                </Link>
                <Link to="/leaderboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  <Trophy size={18} /> Leaderboard
                </Link>
                <Link to="/analytics" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  <LineChart size={18} /> Analytics
                </Link>
                {user.user_metadata?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-500 transition border border-rose-200 bg-rose-50 px-3 py-1 rounded-full">
                    Admin Portal
                  </Link>
                )}
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <UserIcon size={16} />
                    </div>
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                  <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-red-500 transition rounded-full hover:bg-red-50">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
