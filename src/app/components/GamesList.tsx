import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { SERVER_URL } from "../supabaseClient";
import { Brain, Zap, Target, LayoutGrid, Shapes, BarChart3, Gamepad2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ReactNode> = {
  "LayoutGrid": <LayoutGrid size={32} className="text-blue-500" />,
  "Zap": <Zap size={32} className="text-amber-500" />,
  "Shapes": <Shapes size={32} className="text-purple-500" />,
  "Target": <Target size={32} className="text-emerald-500" />,
  "Brain": <Brain size={32} className="text-rose-500" />,
  "BarChart3": <BarChart3 size={32} className="text-cyan-500" />,
  "Gamepad2": <Gamepad2 size={32} className="text-indigo-500" />
};

export default function GamesList() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      toast.error("Please login to access games.");
      navigate("/login");
      return;
    }
    
    const fetchGames = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/games`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (!res.ok) throw new Error("Failed to load games");
        const data = await res.json();
        setGames(data.games || []);
      } catch (err) {
        console.warn("Backend games API failed, falling back to local catalog:", err);
        // Fallback to default games if backend is unreachable or throws ES256 error
        setGames([
          {
            id: "memory",
            name: "Memory Pattern Game",
            description: "Memorize the pattern of highlighted tiles and recreate it. Tests spatial memory and cognitive capacity. Found in Accenture rounds.",
            iconId: "LayoutGrid",
            color: "bg-blue-50 border-blue-200 hover:border-blue-400",
            link: "/games/memory",
          },
          {
            id: "reaction",
            name: "Reaction Speed",
            description: "Click as fast as possible when the screen turns green. Measures processing speed and focus under pressure. Common in Capgemini tests.",
            iconId: "Zap",
            color: "bg-amber-50 border-amber-200 hover:border-amber-400",
            link: "/games/reaction",
          },
          {
            id: "shape-match",
            name: "Shape Order Match",
            description: "Quickly map scrambled shapes to their original positions. Tests visual processing and working memory.",
            iconId: "Shapes",
            color: "bg-purple-50 border-purple-200 hover:border-purple-400",
            link: "/games/shape-match",
          },
          {
            id: "triangle-puzzle",
            name: "Missing Number Triangle",
            description: "Solve rapid mental math and deduce the mathematical pattern to find the missing center number.",
            iconId: "Target",
            color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
            link: "/games/triangle-puzzle",
          },
          {
            id: "logical",
            name: "Logical Deduction",
            description: "Determine the missing element in a sequence. Tests abstract reasoning and pattern recognition.",
            iconId: "Brain",
            color: "bg-rose-50 border-rose-200 hover:border-rose-400",
            link: "/games/logical-deduction",
          },
          {
            id: "data-interpretation",
            name: "Data Interpretation",
            description: "Analyze charts quickly and answer accurately. Tests fast data reading and analysis.",
            iconId: "BarChart3",
            color: "bg-cyan-50 border-cyan-200 hover:border-cyan-400",
            link: "/games/data-interpretation",
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, [session, navigate]);

  if (loading) {
    return <div className="flex-1 flex justify-center items-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Assessment Games Library</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Choose a game below to start practicing. Each game tracks your score and compares it against global leaderboards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              to={game.link}
              className={`block h-full p-8 rounded-2xl border-2 transition-all duration-200 bg-white ${game.color || "border-slate-200 hover:border-slate-400 bg-slate-50"} hover:shadow-md`}
              onClick={(e) => {
                if (game.link === "#") {
                  e.preventDefault();
                  toast.info("This game is coming soon!");
                }
              }}
            >
              <div className="flex items-start gap-6">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                  {ICON_MAP[game.iconId] || <Gamepad2 size={32} className="text-slate-500" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{game.name}</h3>
                  <p className="text-slate-600 leading-relaxed">{game.description}</p>
                  
                  {game.link !== "#" ? (
                    <div className="mt-6 inline-flex items-center text-sm font-bold text-slate-900">
                      Play Now &rarr;
                    </div>
                  ) : (
                    <div className="mt-6 inline-flex items-center text-sm font-bold text-slate-400">
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
