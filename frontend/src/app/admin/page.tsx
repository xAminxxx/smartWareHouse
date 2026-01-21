"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, AuthUser } from "../../lib/auth";
import { 
  Camera, Truck, Package, Activity, CheckCircle, 
  LogOut, LayoutDashboard, Database, Settings, 
  Menu, X, Bell, Search, Loader2, BarChart3, TrendingUp,
  MessageSquare, Send, ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Système prêt. Je suis votre copilote logistique. Posez-moi vos questions sur le stock ou les commandes." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (!auth || auth.role !== "admin") {
      router.push("/login");
    } else {
      setUser(auth);
    }
  }, [router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [inventoryRes, metricsRes] = await Promise.all([
          fetch("http://localhost:8000/inventory"),
          fetch("http://localhost:8000/dashboard")
        ]);
        const inventoryData = await inventoryRes.json();
        const metricsData = await metricsRes.json();
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setMetrics(metricsData);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/process-entrance", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setVisionResult(data);
    } catch (err) {
      console.error("Error processing image:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatLog(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chatbot-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          detected_plate: visionResult?.plate,
          vision_reasoning: visionResult?.analysis,
          vision_decision: visionResult?.decision
        }),
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { role: "ai", text: data.message }]);
    } catch (err) {
      setChatLog(prev => [...prev, { role: "ai", text: "Erreur de connexion au moteur LLM." }]);
    } finally {
      setChatLoading(false);
    }
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
          {sidebarOpen && <span className="font-bold text-xl tracking-tight">Smart<span className="text-blue-500">WH</span></span>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link href="/admin">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active sidebarOpen={sidebarOpen} />
          </Link>
          <Link href="/admin/inventory">
            <NavItem icon={<Package />} label="Inventaire" sidebarOpen={sidebarOpen} />
          </Link>
          <Link href="/admin/settings">
            <NavItem icon={<Settings />} label="Paramètres" sidebarOpen={sidebarOpen} />
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
            <h1 className="text-sm font-bold text-slate-400 hidden sm:block">Panneau de Contrôle Logistique</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">System Live</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-500/20 ring-2 ring-white">
                {user.fullName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-hidden flex flex-col p-8 space-y-8">
          {/* Header & Stats */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-4xl font-black tracking-tighter">Tableau de Bord <span className="text-blue-500">IA</span></h2>
              <p className="text-slate-500 font-medium">Gestion intelligente de l'infrastructure logistique</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {metrics && (
                <>
                  <StatCard icon={<Truck className="text-cyan-400" />} label="Voitures Arrivées Aujourd'hui" value={metrics.arrived_today?.toString() || "0"} />
                  <StatCard icon={<CheckCircle className="text-emerald-400" />} label="Commandes Actives" value={metrics.active_orders?.toString() || "0"} />
                  <StatCard icon={<Package className="text-orange-400" />} label="Produits" value={metrics.total_products?.toString() || "0"} />
                  <StatCard icon={<TrendingUp className="text-emerald-400" />} label="Stock Moyen" value={metrics.avg_stock?.toString() || "0"} />
                </>
              )}
            </div>
          </div>

          {/* Main Grid: 3 Massive Columns */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
            
            {/* COLUMN 1: Visual & Stock (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-8 overflow-y-auto pr-2 scrollbar-custom">
              {/* Camera Section */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl shrink-0">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-black tracking-widest uppercase">Caméra - Gate 01</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Live Feed</span>
                </div>
                
                <div className="aspect-video bg-slate-50 relative flex items-center justify-center group bg-linear-to-br from-slate-50 to-white">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                  ) : (
                    <div className="flex flex-col items-center opacity-20 group-hover:opacity-40 transition-all duration-500">
                      <Camera className="w-16 h-16 mb-4" />
                      <p className="text-xs font-bold tracking-widest text-slate-400">SIGNAL ABSENT</p>
                    </div>
                  )}
                  
                  {loading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-10">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-blue-500/10 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span className="text-xs font-black text-blue-400 tracking-[0.3em] animate-pulse">PROCESSING OCR...</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <label className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all cursor-pointer shadow-lg shadow-blue-900/20 active:scale-95 group uppercase text-xs tracking-wider">
                    <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Capturer Entrée
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
                </div>
              </div>

              {/* Status List */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shrink-0">
                <h3 className="text-[10px] font-black mb-6 flex items-center gap-2 text-slate-500 uppercase tracking-widest">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Inventaire Critique
                </h3>
                <div className="space-y-5">
                  {inventory.length > 0 ? (
                    inventory.slice(0, 3).map((item, idx) => (
                      <StatusItem 
                        key={idx} 
                        label={item.name} 
                        val={item.stock} 
                        total={item.stock > 100 ? 500 : 100} 
                        color={item.stock < 20 ? "bg-red-500" : item.stock < 100 ? "bg-blue-500" : "bg-emerald-500"} 
                      />
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-600 font-bold uppercase">Chargement...</p>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Analysis (Span 4) */}
            <div className="lg:col-span-4 flex flex-col min-h-0">
               <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl flex flex-col overflow-hidden">
                  <h3 className="text-[10px] font-black mb-8 flex items-center gap-2 text-slate-500 uppercase tracking-widest">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Raisonnement de l'Agent
                  </h3>

                  {visionResult ? (
                    <div className="flex-1 flex flex-col animate-fade-in min-h-0">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl ring-1 ring-blue-500/20">
                          <Truck className="w-10 h-10 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">DÉTECTION VALIDÉE</p>
                          <h3 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">{visionResult.plate}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">{visionResult.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-200/50 mb-8 overflow-y-auto scrollbar-custom">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Analyse Contextuelle</p>
                        <p className="text-slate-700 leading-relaxed italic border-l-2 border-blue-600 pl-4 text-sm font-medium">
                          "{visionResult.analysis}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 shrink-0">
                        <DecisionCardMini label="QUAI" value={visionResult.decision?.gate || "N/A"} icon={<LayoutDashboard className="text-blue-400" />} />
                        <DecisionCardMini label="ACTION" value={visionResult.decision?.action || "N/A"} icon={<Truck className="text-emerald-400" />} />
                        <DecisionCardMini label="PRIORITÉ" value={visionResult.decision?.priority || "N/A"} icon={<Activity className="text-orange-400" />} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                      <Activity className="w-16 h-16 text-slate-400 mb-6 animate-pulse" />
                      <p className="text-sm font-bold max-w-[200px] text-slate-500 leading-relaxed">En attente d'une entrée véhicule pour analyse</p>
                    </div>
                  )}
               </div>
            </div>

            {/* COLUMN 3: AI Co-pilot (Chatbot) (Span 4) */}
            <div className="lg:col-span-4 flex flex-col min-h-0">
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 flex flex-col shadow-2xl overflow-hidden ring-1 ring-slate-100">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Copilote LLM</h4>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Agent IA Actif</span>
                      </div>
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer" />
                </div>

                {/* Chat Log */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs scrollbar-custom bg-slate-50/20">
                  {chatLog.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-3xl ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-500/10 font-medium' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent réfléchit...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <form onSubmit={handleChatSubmit} className="relative group">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Pilotage par prompt (ex: Etat du stock HP)"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                    />
                    <button 
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-30 active:scale-90 shadow-lg shadow-indigo-600/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-xl ring-1 ring-slate-100 min-w-[140px]">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
        <p className="text-xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
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

function StatusItem({ label, val, total, color }: any) {
  const percent = (val / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold">
        <span className="text-slate-500">{label}</span>
        <span className={percent < 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'}>{val} / {total}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-px">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function DecisionCardMini({ label, value, icon }: any) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-sm font-black tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </div>
  );
}
