"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAuth, getAuth, AuthUser } from "../../lib/auth";
import { LogIn, UserPlus, Shield, User, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const user = getAuth();
    if (user) {
      router.push(user.role === "admin" ? "/admin" : "/client");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        const user: AuthUser = {
          id: String(data.user.id),
          email: data.user.email,
          fullName: data.user.fullName,
          company: data.user.company,
          role: data.user.role as "admin" | "client",
        };
        setAuth(user);
        router.push(user.role === "admin" ? "/admin" : "/client");
      } else {
        setError(data.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Bienvenue</h1>
            <p className="text-slate-500 text-sm">Connectez-vous à votre espace SmartWarehouse</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="nom@entreprise.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
            <button 
              onClick={() => router.push("/register")}
              className="text-center text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              Pas encore de compte ? <span className="text-blue-600 font-semibold underline decoration-blue-600/30 underline-offset-4">S'enregistrer</span>
            </button>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-400 text-xs">
          SmartWarehouse AI v2.0 &bull; Secure Logistics Engine
        </p>
      </div>
    </div>
  );
}
