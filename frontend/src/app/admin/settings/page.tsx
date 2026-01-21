"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, AuthUser } from "../../../lib/auth";
import { 
  Package, LogOut, LayoutDashboard, Database, Settings, 
  Menu, X, Bell, Search, Loader2, User, 
  Shield, BellRing, Monitor, Globe, Save, Key, Trash2, ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const router = useRouter();

  const [settings, setSettings] = useState({
    warehouseName: "Centrale SmartWarehouse A1",
    notifications: true,
    darkMode: false,
    apiEndpoint: "http://localhost:8000",
    language: "Français"
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth || auth.role !== "admin") {
      router.push("/login");
    } else {
      setUser(auth);
      const saved = localStorage.getItem("wms_settings");
      if (saved) setSettings(JSON.parse(saved));
    }
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          new_password: passwords.new
        }),
      });
      if (res.ok) {
        alert("Mot de passe mis à jour !");
        setShowPasswordModal(false);
        setPasswords({ new: "", confirm: "" });
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("ATTENTION : Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?")) return;
    
    try {
      const res = await fetch("http://localhost:8000/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id }),
      });
      if (res.ok) {
        handleLogout();
      }
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("wms_settings", JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      alert("Paramètres enregistrés localement !");
    }, 800);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight text-slate-900">Smart<span className="text-blue-500">WH</span></span>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link href="/admin">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" sidebarOpen={sidebarOpen} />
          </Link>
          <Link href="/admin/inventory">
            <NavItem icon={<Package />} label="Inventaire" sidebarOpen={sidebarOpen} />
          </Link>
          <Link href="/admin/settings">
            <NavItem icon={<Settings />} label="Paramètres" active sidebarOpen={sidebarOpen} />
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-bold text-slate-400 hidden sm:block">Configurations Système</h1>
          </div>

          <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-500/20 ring-2 ring-white text-white">
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-custom">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Control <span className="text-blue-500">Center</span></h2>
              <p className="text-slate-500 font-medium">Gérez votre profil et les paramètres du SmartWarehouse</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column: User Profile */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-32 h-32 bg-linear-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-1 shadow-2xl mb-6 ring-4 ring-slate-100">
                    <div className="w-full h-full bg-white rounded-[1.8rem] flex items-center justify-center text-4xl font-black italic text-blue-500">
                      {user.fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{user.fullName}</h3>
                  <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-1 rounded-full mb-8">
                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">{user.role}</span>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><Globe className="w-4 h-4 text-slate-400" /></div>
                      <div className="overflow-hidden">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Email</p>
                        <p className="text-sm font-medium text-slate-600 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><Monitor className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Dernière connexion</p>
                        <p className="text-sm font-medium text-slate-600">Aujourd'hui, 12:45</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Sécurité</h4>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                    <span className="text-sm font-bold text-slate-700">Changer de mot de passe</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200" />
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-between group text-red-500"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 opacity-50" />
                    <span className="text-sm font-bold">Supprimer le compte</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Columns: System Settings */}
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl">
                <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tight italic flex items-center gap-3">
                  <Monitor className="text-blue-500" /> Paramètres du <span className="text-blue-500 underline decoration-blue-500/20 underline-offset-8">WMS</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom de l'Entrepôt</label>
                      <input 
                        type="text" 
                        value={settings.warehouseName}
                        onChange={(e) => setSettings({...settings, warehouseName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">API Endpoint Backend</label>
                      <input 
                        type="text" 
                        value={settings.apiEndpoint}
                        onChange={(e) => setSettings({...settings, apiEndpoint: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm outline-none font-mono focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500"><BellRing className="w-5 h-5" /></div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Notifications Push</p>
                          <p className="text-[10px] text-slate-500 font-medium">Alertes de stock et entrées</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications}
                          onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-500"><Shield className="w-5 h-5" /></div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Mode Haute Sécurité</p>
                          <p className="text-[10px] text-slate-500 font-medium">Contrôle stricter des accès</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Langue de l'interface</label>
                      <select 
                        value={settings.language}
                        onChange={(e) => setSettings({...settings, language: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer text-slate-900"
                      >
                        <option>Français</option>
                        <option>English</option>
                        <option>Arabe</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center shrink-0">
                  <Monitor className="w-10 h-10 text-blue-500" />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Support <span className="text-blue-500">Premium</span></h4>
                  <p className="text-slate-500 text-sm font-medium">Vous avez besoin d'aide pour configurer votre matériel de vision ? Contactez nos experts.</p>
                </div>
                <button className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-lg">
                  Contactez-nous
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight italic text-slate-900">Changer <span className="text-blue-500">Mot de Passe</span></h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  required
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900"
                />
              </div>
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {saving ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active = false, sidebarOpen = true }: any) {
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}
    `}>
      <div className={`shrink-0 ${active ? 'text-white' : 'group-hover:text-blue-600'}`}>{icon}</div>
      {sidebarOpen && <span className="text-sm">{label}</span>}
    </div>
  );
}
