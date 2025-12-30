"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, AuthUser } from "../../lib/auth";
import { 
  LogOut, Package, MessageSquare, Send, 
  Clock, CheckCircle, User, Loader2, 
  ArrowRight, Search, Plus
} from "lucide-react";

export default function ClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Bonjour ! Je suis votre assistant logistique. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (!auth || auth.role !== "client") {
      router.push("/login");
    } else {
      setUser(auth);
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:8000/chat-sessions/${user.id}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const loadSession = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/chat-messages/${sessionId}`);
      const data = await res.json();
      setChatLog(data.map((m: any) => ({ role: m.role, text: m.content })));
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setChatLog([{ role: "ai", text: "Nouvelle session démarrée. Bagaimana saya bisa membantu Anda?" }]);
    document.getElementById('chat-input')?.focus();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMsg = chatInput;
    setChatLog(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chatbot-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          user_id: user?.id,
          session_id: activeSessionId
        }),
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { role: "ai", text: data.message }]);
      if (data.session_id && !activeSessionId) {
        setActiveSessionId(data.session_id);
        fetchSessions();
      }
    } catch (err) {
      setChatLog(prev => [...prev, { role: "ai", text: "Désolé, j'ai du mal à me connecter au serveur." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Client Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block">SmartPortal</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block text-xs uppercase font-bold tracking-tight text-slate-500">
               {user.fullName}
            </div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner">
              {user.fullName.charAt(0)}
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Orders & Status */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Bonjour, <span className="text-blue-600">{user.fullName.split(' ')[0]}</span>.
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Prêt pour votre prochaine commande logistique ?</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Historique des Sessions
            </h3>
            <div className="bg-white border border-slate-200 rounded-4xl overflow-hidden shadow-sm">
                {sessions.length > 0 ? (
                  sessions.map((s) => (
                    <HistoryItem 
                      key={s.idSession}
                      title={s.title} 
                      date={new Date(s.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} 
                      status={activeSessionId === s.idSession ? "Actif" : "Archives"} 
                      active={activeSessionId === s.idSession}
                      onClick={() => loadSession(s.idSession)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm italic">
                    Aucune session passée trouvée.
                  </div>
                )}
            </div>
          </div>

          <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-4xl text-white shadow-xl shadow-blue-500/20">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouvelle Discussion
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Posez votre question à l'IA pour démarrer une nouvelle session logistique intelligente.
            </p>
            <button 
              onClick={startNewChat}
              className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all active:scale-95"
            >
              Démarrer maintenant
            </button>
          </div>
        </div>

        {/* Right Side: AI Assistant */}
        <div className="lg:col-span-12 xl:col-span-5 h-[600px] xl:h-[calc(100vh-200px)] sticky top-28">
          <div className="bg-white rounded-4xl border border-slate-200 flex flex-col h-full shadow-2xl shadow-blue-900/5 overflow-hidden ring-1 ring-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Assistant Logistique</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expert IA en ligne</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm bg-linear-to-b from-white to-slate-50">
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-slate-100">
              <form onSubmit={handleChatSubmit} className="relative">
                <input 
                  id="chat-input"
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Dites quelque chose comme 'Commander 10 claviers'..."
                  className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-95 active:scale-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HistoryItem({ title, date, status, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 flex items-center justify-between border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all cursor-pointer group ${active ? 'bg-blue-50/50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'} rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <p className={`font-bold text-sm ${active ? 'text-blue-700' : 'text-slate-800'}`}>{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
          {status}
        </span>
        <ArrowRight className={`w-4 h-4 transition-all transform group-hover:translate-x-1 ${active ? 'text-blue-600' : 'text-slate-300'}`} />
      </div>
    </div>
  );
}
