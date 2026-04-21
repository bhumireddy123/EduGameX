import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono().basePath("/make-server-39e51199");

app.use("*", logger(console.log));
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Auth middleware helper
const getUserAndRole = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); 
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, role: user.user_metadata?.role || "student", user };
};

const getUserId = async (req: Request) => {
  const u = await getUserAndRole(req);
  return u?.id || null;
};

app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return c.json({ error: error.message }, 401);
    }
    return c.json({ session: data.session, user: data.user }, 200);
  } catch (err: any) {
    console.error("Unhandled login error:", err);
    return c.json({ error: err.message }, 500);
  }
});
app.post("/api/auth/register", async (c) => {
  try {
    const { email, password, name, education, stream, role } = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        education, 
        stream, 
        role: role || "student", // Allow creating an admin during signup for testing purposes
        createdAt: new Date().toISOString()
      },
      email_confirm: true,
    });

    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }
    return c.json({ user: data.user }, 200);
  } catch (err: any) {
    console.error("Unhandled signup error:", err);
    return c.json({ error: err.message }, 500);
  }
});

app.post("/api/scores", async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { gameId, score, details } = await c.req.json();
    if (!gameId || typeof score !== "number") {
      return c.json({ error: "Missing gameId or score" }, 400);
    }

    const timestamp = Date.now();
    const key = `score:${userId}:${gameId}:${timestamp}`;
    const value = { gameId, score, details, timestamp, userId };

    // Save individual score
    await kv.set(key, value);

    // Update highest score for leaderboard
    const lbKey = `leaderboard:${gameId}:${userId}`;
    const bestScore: any = await kv.get(lbKey);
    if (!bestScore || score > bestScore.score) {
      // Fetch user profile name, handle it gracefully
      let userName = "Anonymous";
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: userRecord } = await supabase.auth.admin.getUserById(userId);
        if (userRecord?.user?.user_metadata?.name) {
          userName = userRecord.user.user_metadata.name;
        }
      } catch(e) { console.error("Error fetching username", e) }
      
      await kv.set(lbKey, { score, timestamp, userId, userName });
    }

    return c.json({ success: true, key }, 200);
  } catch (err: any) {
    console.error("Error saving score:", err);
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/scores", async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    // Fetch all user's scores
    const prefix = `score:${userId}:`;
    const scores = await kv.getByPrefix(prefix);
    return c.json({ scores }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/leaderboard/:gameId", async (c) => {
  try {
    const gameId = c.req.param("gameId");
    const prefix = `leaderboard:${gameId}:`;
    const entries = await kv.getByPrefix(prefix);
    
    // Sort descending
    const sorted = entries.sort((a: any, b: any) => b.score - a.score).slice(0, 50);
    return c.json({ leaderboard: sorted }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

const DEFAULT_GAMES = [
  {
    id: "memory",
    name: "Memory Pattern Game",
    description: "Memorize the pattern of highlighted tiles and recreate it. Tests spatial memory and cognitive capacity. Found in Accenture rounds.",
    iconId: "LayoutGrid",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    link: "/games/memory",
    createdAt: Date.now()
  },
  {
    id: "reaction",
    name: "Reaction Speed",
    description: "Click as fast as possible when the screen turns green. Measures processing speed and focus under pressure. Common in Capgemini tests.",
    iconId: "Zap",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    link: "/games/reaction",
    createdAt: Date.now()
  },
  {
    id: "shape-match",
    name: "Shape Order Match",
    description: "Quickly map scrambled shapes to their original positions. Tests visual processing and working memory.",
    iconId: "Shapes",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    link: "/games/shape-match",
    createdAt: Date.now()
  },
  {
    id: "triangle-puzzle",
    name: "Missing Number Triangle",
    description: "Solve rapid mental math and deduce the mathematical pattern to find the missing center number.",
    iconId: "Target",
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    link: "/games/triangle-puzzle",
    createdAt: Date.now()
  },
  {
    id: "logical",
    name: "Logical Deduction",
    description: "Determine the missing element in a sequence. Tests abstract reasoning and pattern recognition.",
    iconId: "Brain",
    color: "bg-rose-50 border-rose-200 hover:border-rose-400",
    link: "/games/logical-deduction",
    createdAt: Date.now()
  },
  {
    id: "data-interpretation",
    name: "Data Interpretation",
    description: "Analyze charts quickly and answer accurately. Tests fast data reading and analysis.",
    iconId: "BarChart3",
    color: "bg-cyan-50 border-cyan-200 hover:border-cyan-400",
    link: "/games/data-interpretation",
    createdAt: Date.now()
  }
];

app.get("/api/games", async (c) => {
  try {
    const userRoleInfo = await getUserAndRole(c.req.raw);
    if (!userRoleInfo) return c.json({ error: "Unauthorized" }, 401);

    // Fetch custom games from KV
    const customGames = await kv.getByPrefix("game:custom:");
    
    // Check for deleted default games
    const deletedGamesData = await kv.getByPrefix("game:deleted:");
    const deletedGameIds = new Set(deletedGamesData.map((dg: any) => dg.id));

    // Filter out deleted default games
    const activeDefaultGames = DEFAULT_GAMES.filter(g => !deletedGameIds.has(g.id));
    
    // Combine and return
    const allGames = [...activeDefaultGames, ...customGames];
    return c.json({ games: allGames }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/api/games", async (c) => {
  try {
    const userRoleInfo = await getUserAndRole(c.req.raw);
    if (!userRoleInfo || userRoleInfo.role !== "admin") return c.json({ error: "Unauthorized. Admin access required." }, 403);

    const gameData = await c.req.json();
    const id = gameData.id || `custom-${Date.now()}`;
    const newGame = {
      id,
      name: gameData.name,
      description: gameData.description,
      iconId: gameData.iconId || "Gamepad2",
      color: gameData.color || "bg-slate-50 border-slate-200 hover:border-slate-400",
      link: gameData.link || "#",
      createdAt: Date.now(),
      createdBy: userRoleInfo.id
    };

    await kv.set(`game:custom:${id}`, newGame);
    return c.json({ success: true, game: newGame }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/api/games/:id", async (c) => {
  try {
    const userRoleInfo = await getUserAndRole(c.req.raw);
    if (!userRoleInfo || userRoleInfo.role !== "admin") return c.json({ error: "Unauthorized. Admin access required." }, 403);

    const gameId = c.req.param("id");
    
    if (DEFAULT_GAMES.some(g => g.id === gameId)) {
      // Mark default game as deleted
      await kv.set(`game:deleted:${gameId}`, { id: gameId, deletedAt: Date.now() });
    } else {
      // Delete custom game
      await kv.mdel([`game:custom:${gameId}`]);
    }
    
    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/admin/users", async (c) => {
  try {
    const userRoleInfo = await getUserAndRole(c.req.raw);
    if (!userRoleInfo || userRoleInfo.role !== "admin") return c.json({ error: "Unauthorized. Admin access required." }, 403);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const mappedUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || "Unknown",
      role: u.user_metadata?.role || "student",
      education: u.user_metadata?.education || "N/A",
      stream: u.user_metadata?.stream || "N/A",
      createdAt: u.created_at
    }));

    return c.json({ users: mappedUsers }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/api/admin/users/:id", async (c) => {
  try {
    const userRoleInfo = await getUserAndRole(c.req.raw);
    if (!userRoleInfo || userRoleInfo.role !== "admin") return c.json({ error: "Unauthorized. Admin access required." }, 403);

    const userIdToDelete = c.req.param("id");
    
    // Prevent admin from deleting themselves
    if (userIdToDelete === userRoleInfo.id) {
      return c.json({ error: "Cannot delete your own admin account." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.auth.admin.deleteUser(userIdToDelete);
    if (error) throw error;

    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/admin/stats", async (c) => {
  try {
    const userRoleInfo = await getUserAndRole(c.req.raw);
    if (!userRoleInfo || userRoleInfo.role !== "admin") return c.json({ error: "Unauthorized. Admin access required." }, 403);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { users } } = await supabase.auth.admin.listUsers();

    // Since KV lacks a global "list all keys" without prefix, we'll estimate game stats
    const stats = {
      totalUsers: users.length,
      adminUsers: users.filter((u: any) => u.user_metadata?.role === "admin").length,
      studentUsers: users.filter((u: any) => u.user_metadata?.role !== "admin").length,
    };

    return c.json(stats, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

Deno.serve(app.fetch);
