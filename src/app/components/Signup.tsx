import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { BrainCircuit, Eye, EyeOff, Loader2 } from "lucide-react";
import { SERVER_URL, publicAnonKey } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

// ── Password strength rules ────────────────────────────────────────────────
interface PasswordCheck {
  label: string;
  valid: boolean;
}

const getPasswordChecks = (pass: string): PasswordCheck[] => [
  { label: "At least 8 characters",      valid: pass.length >= 8 },
  { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(pass) },
  { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(pass) },
  { label: "One number (0-9)",           valid: /\d/.test(pass) },
  { label: "One special character",      valid: /[^A-Za-z0-9]/.test(pass) },
];

const isPasswordValid = (pass: string) =>
  getPasswordChecks(pass).every((c) => c.valid);

// ── Component ────────────────────────────────────────────────────────────────
export default function Signup() {
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [education, setEducation] = useState("1st Year");
  const [stream,    setStream]    = useState("CSE");
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate    = useNavigate();
  const { session } = useAuth();

  // Redirect already-authenticated users
  if (session) {
    navigate(session.user.user_metadata?.role === "admin" ? "/admin" : "/dashboard");
    return null;
  }

  const checks = getPasswordChecks(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(password)) {
      toast.error("Password does not meet all requirements.");
      return;
    }

    setIsLoading(true);

    try {
      /**
       * We use the backend Edge Function for registration because it calls
       * supabase.auth.admin.createUser() with email_confirm: true, which
       * means the account is instantly confirmed — no email verification
       * needed and the user can log in right away.
       */
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          education,
          stream,
          role: "student", // All self-registrations are students
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      toast.success("Account created successfully! You can now sign in.");
      navigate("/login");
    } catch (error: any) {
      const msg: string = error.message || "Failed to create account.";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already been registered") ||
        msg.toLowerCase().includes("email address is already")
      ) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600 mb-6">
          <BrainCircuit size={48} />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSignup} noValidate>

            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Sudharshan Reddy"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="signup-password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Live password strength checklist */}
              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {checks.map((c) => (
                    <li
                      key={c.label}
                      className={`text-xs flex items-center gap-1.5 ${
                        c.valid ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          c.valid
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {c.valid ? "✓" : "·"}
                      </span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Education Status */}
            <div>
              <label htmlFor="signup-education" className="block text-sm font-medium text-slate-700">
                Education Status (Year)
              </label>
              <div className="mt-1">
                <select
                  id="signup-education"
                  required
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Stream */}
            <div>
              <label htmlFor="signup-stream" className="block text-sm font-medium text-slate-700">
                Stream / Branch
              </label>
              <div className="mt-1">
                <select
                  id="signup-stream"
                  required
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                >
                  <option value="CSE">CSE — Computer Science &amp; Engineering</option>
                  <option value="IT">IT — Information Technology</option>
                  <option value="ECE">ECE — Electronics &amp; Communication</option>
                  <option value="EEE">EEE — Electrical &amp; Electronics</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                id="signup-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> Creating account…</>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
