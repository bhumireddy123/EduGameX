import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { SERVER_URL } from "../supabaseClient";
import { ShieldCheck, Users, Gamepad2, Plus, Trash2, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");

  const [newGameForm, setNewGameForm] = useState({ name: "", description: "", link: "", iconId: "Gamepad2" });
  const [isAddingGame, setIsAddingGame] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }
    if (session.user.user_metadata?.role !== "admin") {
      toast.error("Unauthorized access. Redirecting to student dashboard.");
      navigate("/dashboard");
      return;
    }

    fetchAdminData();
  }, [session, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${session?.access_token}` };

    // Fetch each dataset independently so one failure doesn't block the rest
    await Promise.allSettled([
      fetch(`${SERVER_URL}/api/admin/stats`, { headers })
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((data) => setStats(data))
        .catch((e) => console.warn("Stats fetch failed:", e)),

      fetch(`${SERVER_URL}/api/admin/users`, { headers })
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((data) => setUsers(data.users ?? []))
        .catch((e) => console.warn("Users fetch failed:", e)),

      fetch(`${SERVER_URL}/api/games`, { headers })
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((data) => setGames(data.games ?? []))
        .catch((e) => console.warn("Games fetch failed:", e)),
    ]);

    setLoading(false);
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingGame(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newGameForm)
      });
      if (!res.ok) throw new Error("Failed to add game");
      toast.success("Game added to catalog successfully");
      setNewGameForm({ name: "", description: "", link: "", iconId: "Gamepad2" });
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game from the catalog?")) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/games/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error("Failed to delete game");
      toast.success("Game removed successfully");
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === session?.user.id) {
      toast.error("You cannot delete your own admin account.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      toast.success("User deleted successfully");
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-indigo-600" size={36} />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-slate-600">Manage users, games, and monitor platform usage.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-8">
        <button onClick={() => setActiveTab("stats")} className={`px-6 py-3 font-bold flex items-center gap-2 ${activeTab === "stats" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}>
          <BarChart3 size={18} /> Platform Stats
        </button>
        <button onClick={() => setActiveTab("users")} className={`px-6 py-3 font-bold flex items-center gap-2 ${activeTab === "users" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}>
          <Users size={18} /> Users Management
        </button>
        <button onClick={() => setActiveTab("games")} className={`px-6 py-3 font-bold flex items-center gap-2 ${activeTab === "games" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}>
          <Gamepad2 size={18} /> Game Catalog
        </button>
      </div>

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 font-bold mb-2 uppercase text-sm tracking-wider">Total Registered Users</h3>
            <div className="text-5xl font-black text-indigo-600">{stats?.totalUsers || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 font-bold mb-2 uppercase text-sm tracking-wider">Active Students</h3>
            <div className="text-5xl font-black text-emerald-600">{stats?.studentUsers || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 font-bold mb-2 uppercase text-sm tracking-wider">Available Games</h3>
            <div className="text-5xl font-black text-rose-600">{games.length}</div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 font-bold text-slate-700">Name</th>
                  <th className="py-4 px-6 font-bold text-slate-700">Email</th>
                  <th className="py-4 px-6 font-bold text-slate-700">Role</th>
                  <th className="py-4 px-6 font-bold text-slate-700">Education</th>
                  <th className="py-4 px-6 font-bold text-slate-700">Stream</th>
                  <th className="py-4 px-6 font-bold text-slate-700">Joined</th>
                  <th className="py-4 px-6 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-medium text-slate-900">{u.name}</td>
                    <td className="py-4 px-6 text-slate-600">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{u.education}</td>
                    <td className="py-4 px-6 text-slate-600">{u.stream}</td>
                    <td className="py-4 px-6 text-slate-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      {u.id !== session?.user.id && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "games" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Current Games Catalog</h2>
            <div className="space-y-4">
              {games.map(g => (
                <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{g.name}</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-md line-clamp-1">{g.description}</p>
                    <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded mt-2 inline-block text-slate-600">{g.link}</div>
                  </div>
                  <button onClick={() => handleDeleteGame(g.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition" title="Delete Game">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {games.length === 0 && <p className="text-slate-500 text-center py-8">No games found.</p>}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Game Link</h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <form onSubmit={handleAddGame} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Game Name</label>
                  <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newGameForm.name} onChange={e => setNewGameForm({...newGameForm, name: e.target.value})} placeholder="e.g. Logic Puzzle" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" value={newGameForm.description} onChange={e => setNewGameForm({...newGameForm, description: e.target.value})} placeholder="Describe the game..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route Link</label>
                  <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" value={newGameForm.link} onChange={e => setNewGameForm({...newGameForm, link: e.target.value})} placeholder="/games/logic-puzzle" />
                  <p className="text-xs text-slate-500 mt-1">Must be an existing internal route.</p>
                </div>
                <button type="submit" disabled={isAddingGame} className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-70">
                  {isAddingGame ? <Loader2 size={20} className="animate-spin" /> : <><Plus size={20} /> Add to Catalog</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}