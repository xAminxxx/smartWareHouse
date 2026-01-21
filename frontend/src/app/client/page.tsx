"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, AuthUser } from "../../lib/auth";
import { 
  LogOut, MessageSquare, Send, 
  Plus, Menu, X, Trash2,
  Package, ChevronDown, Edit3
} from "lucide-react";

export default function ClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
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
    setChatLog([]);
    setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:8000/chat-sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.idSession !== sessionId));
      if (activeSessionId === sessionId) {
        startNewChat();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
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
      setChatLog(prev => [...prev, { role: "ai", text: "Désolé, une erreur s'est produite. Veuillez réessayer." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Smart<span className="text-blue-500">WH</span></span>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all group shadow-lg shadow-blue-500/20 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Nouvelle discussion</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <div className="text-xs text-slate-400 px-3 py-2 font-bold uppercase tracking-wider">Historique</div>
          {sessions.length > 0 ? (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.idSession}
                  onClick={() => loadSession(session.idSession)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    activeSessionId === session.idSession 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  {editingSessionId === session.idSession ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => setEditingSessionId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingSessionId(null)}
                      className="flex-1 bg-transparent text-sm outline-none text-slate-900"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate">
                      {session.title || "Nouvelle conversation"}
                    </span>
                  )}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.idSession);
                        setEditTitle(session.title || "");
                      }}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" />
                    </button>
                    <button 
                      onClick={(e) => deleteSession(session.idSession, e)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-slate-400 text-xs">
              Aucune conversation
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-100 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 ring-2 ring-white">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-100 rounded-lg transition-all"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4 text-red-500 hover:text-red-600" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50 relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-bold text-slate-400 hidden sm:block">Espace Client - Assistant Logistique</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">En ligne</span>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          {chatLog.length === 0 ? (
            /* Empty State - Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-slate-900">Bonjour, <span className="text-blue-500">{user.fullName.split(' ')[0]}</span></h1>
              <p className="text-slate-500 text-center max-w-md mb-8">
                Je suis votre assistant logistique. Comment puis-je vous aider aujourd&apos;hui ?
              </p>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  { text: "Commander 10 claviers USB", icon: "📦" },
                  { text: "Vérifier le stock disponible", icon: "📊" },
                  { text: "Suivre mes commandes en cours", icon: "🚚" },
                  { text: "Contacter le support", icon: "💬" }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(action.text);
                      document.getElementById('chat-input')?.focus();
                    }}
                    className="flex items-center gap-3 p-4 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all group shadow-sm hover:shadow-md"
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-sm text-slate-600 group-hover:text-blue-600 transition-colors">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-w-3xl mx-auto w-full px-4 py-6">
              {chatLog.map((msg, i) => (
                <div key={i} className={`mb-6 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20' 
                        : 'bg-blue-600 shadow-lg shadow-blue-500/20'
                    }`}>
                      {msg.role === 'user' ? (
                        <span className="text-xs font-bold">{user.fullName.charAt(0)}</span>
                      ) : (
                        <Package className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className="text-xs text-slate-500 mb-1 font-medium">
                        {msg.role === 'user' ? 'Vous' : 'SmartWarehouse'}
                      </div>
                      <div className={`inline-block text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-lg shadow-blue-500/20'
                          : 'text-slate-700 bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {loading && (
                <div className="mb-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 mb-1 font-medium">SmartWarehouse</div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleChatSubmit} className="relative">
              <div className="relative bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                <textarea 
                  id="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit(e);
                    }
                  }}
                  placeholder="Envoyer un message..."
                  rows={1}
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 px-4 py-3.5 pr-14 text-sm outline-none resize-none max-h-32"
                />
                <button 
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="absolute right-2 bottom-2 w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                SmartWarehouse peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
