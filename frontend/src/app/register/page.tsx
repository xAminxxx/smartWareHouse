"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, User, ArrowLeft, Loader2, Building, Mail } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === "success") {
        alert("✅ Account created successfully! You can now login.");
        router.push("/login");
      } else {
        alert(`❌ Registration failed: ${data.detail || data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert("❌ Connection error. Please check if the backend is running.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl">
          <button 
            onClick={() => router.push("/login")}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Rejoindre le réseau</h1>
            <p className="text-slate-500 text-sm">Créez votre profil client SmartWarehouse</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Jean Dupont"
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Entreprise</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Logistics S.A."
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="nom@entreprise.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Créer mon compte
                  <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
