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

    // Simulation d'authentification (à remplacer par un vrai appel API si disponible)
    setTimeout(() => {
      if (email === "admin@smart.com" && password === "admin") {
        const user: AuthUser = {
          id: "1",
          email: "admin@smart.com",
          fullName: "Admin Principal",
          company: "SmartWarehouse Ltd",
          role: "admin",
        };
        setAuth(user);
        router.push("/admin");
      } else if (email === "client@test.com" && password === "client") {
        const user: AuthUser = {
          id: "2",
          email: "client@test.com",
          fullName: "Client Alpha",
          company: "GlobalTech Solutions",
          role: "client",
        };
        setAuth(user);
        router.push("/client");
      } else {
        setError("Identifiants invalides (admin@smart.com / admin)");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
            <p className="text-slate-400 text-sm">Connectez-vous à votre espace SmartWarehouse</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  placeholder="nom@entreprise.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 group"
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

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col gap-4">
            <button 
              onClick={() => router.push("/register")}
              className="text-center text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              Pas encore de compte ? <span className="text-blue-400 font-semibold underline decoration-blue-400/30 underline-offset-4">S'enregistrer</span>
            </button>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-600 text-xs">
          SmartWarehouse AI v2.0 &bull; Secure Logistics Engine
        </p>
      </div>
    </div>
  );
}
