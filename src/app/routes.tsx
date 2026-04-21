import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import GamesList from "./components/GamesList";
import MemoryGame from "./components/games/MemoryGame";
import ReactionGame from "./components/games/ReactionGame";
import ShapeMatchGame from "./components/games/ShapeMatchGame";
import TrianglePuzzleGame from "./components/games/TrianglePuzzleGame";
import LogicalDeductionGame from "./components/games/LogicalDeductionGame";
import DataInterpretationGame from "./components/games/DataInterpretationGame";
import Analytics from "./components/Analytics";
import Leaderboard from "./components/Leaderboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      // ── Public routes ──────────────────────────────────────────────────────
      { index: true, Component: LandingPage },
      { path: "login",  Component: Login },
      { path: "signup", Component: Signup },

      // ── Student-protected routes (any authenticated user) ──────────────────
      {
        Component: ProtectedRoute,
        children: [
          { path: "dashboard",  Component: Dashboard },
          { path: "games",      Component: GamesList },
          { path: "games/memory",              Component: MemoryGame },
          { path: "games/reaction",            Component: ReactionGame },
          { path: "games/shape-match",         Component: ShapeMatchGame },
          { path: "games/triangle-puzzle",     Component: TrianglePuzzleGame },
          { path: "games/logical-deduction",   Component: LogicalDeductionGame },
          { path: "games/data-interpretation", Component: DataInterpretationGame },
          { path: "analytics",   Component: Analytics },
          { path: "leaderboard", Component: Leaderboard },
        ],
      },

      // ── Admin-only protected route ─────────────────────────────────────────
      {
        Component: AdminRoute,
        children: [
          { path: "admin", Component: AdminDashboard },
        ],
      },
    ],
  },
]);
