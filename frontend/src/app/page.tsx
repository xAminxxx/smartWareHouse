"use client";

import { useState } from "react";
import {
  Camera,
  Truck,
  Package,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");

    try {
      const res = await fetch("http://localhost:8000/chatbot-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setChatLog((prev) => [...prev, { role: "ai", text: data.message }]);
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        { role: "ai", text: "Error connecting to AI assistant." },
      ]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/process-entrance", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error processing image:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            SmartWarehouse AI
          </h1>
          <p className="text-slate-400">Autonomous Logistics Decision Engine</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
            <Activity className="text-emerald-400 w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cam Feed Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                GATE 01 - LIVE CAMERA
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                REC ●
              </span>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center relative">
              {image ? (
                <img
                  src={image}
                  className="w-full h-full object-cover opacity-80"
                  alt="Capture"
                />
              ) : (
                <div className="text-slate-700 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Waiting for vehicle arrival...</p>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-medium text-blue-400">
                      Agent Reasoning...
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <label className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-900/20">
                Simulate Entrance Scan
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          {/* Rapid Inventory Status */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              STOCK MONITOR
            </h3>
            <div className="space-y-3">
              <InventoryItem
                label="Laptops"
                qty={5}
                threshold={10}
                status="critical"
              />
              <InventoryItem
                label="Paper A4"
                qty={200}
                threshold={50}
                status="healthy"
              />
              <InventoryItem
                label="Printer Ink"
                qty={15}
                threshold={20}
                status="low"
              />
            </div>
          </div>

          {/* AI Logistics Assistant (Chatbot) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[350px] shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">
                  AI LOGISTICS ASSISTANT
                </span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-hide">
              <div className="bg-slate-800 p-3 rounded-tr-xl rounded-b-xl max-w-[85%] text-slate-300 border border-slate-700">
                Bonjour! Je peux vous aider à passer une commande. Exemple:
                "Commander 50 claviers pour Client Alpha"
              </div>
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[85%] border ${
                    msg.role === "user"
                      ? "bg-blue-600 border-blue-500 ml-auto rounded-tr-none text-white shadow-lg shadow-blue-900/20"
                      : "bg-slate-800 border-slate-700 rounded-tl-none text-slate-300"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-800">
              <form onSubmit={handleChatSubmit} className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tapez votre commande ici..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="lg:col-span-2">
          {result ? (
            <div
              className={`rounded-2xl border p-8 shadow-2xl transition-all ${
                result.status === "success"
                  ? "bg-slate-900 border-slate-800"
                  : "bg-red-900/10 border-red-900/30"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold bg-blue-500 text-blue-950 px-2 py-0.5 rounded uppercase">
                      Detected: {result.plate}
                    </span>
                    <span className="text-xs text-slate-500">
                      {result.timestamp}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    Agent Decision Intelligence
                  </h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  VERIFIED BY AI
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800/50 whitespace-pre-wrap leading-relaxed text-slate-300">
                  {result.analysis}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Assigned Gate
                  </span>
                  <span className="text-xl font-mono text-blue-400 font-bold">
                    GATE A-04
                  </span>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Instructions
                  </span>
                  <span className="text-sm font-semibold">
                    Proceed to Unloading Area
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed flex flex-col items-center justify-center p-12 text-center">
              <Truck className="w-16 h-16 text-slate-800 mb-4" />
              <h3 className="text-lg font-medium text-slate-500">
                No vehicle data available
              </h3>
              <p className="text-slate-600 text-sm max-w-xs">
                Upload a vehicle image or capture a live feed to trigger the
                autonomous reasoning process.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InventoryItem({
  label,
  qty,
  threshold,
  status,
}: {
  label: string;
  qty: number;
  threshold: number;
  status: "critical" | "low" | "healthy";
}) {
  const colors = {
    critical: "bg-red-500/20 text-red-500 border-red-500/30",
    low: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    healthy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  };

  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
      <div>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-[10px] text-slate-500 block">
          Threshold: {threshold}
        </span>
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status]}`}
      >
        {qty} Units
      </div>
    </div>
  );
}
