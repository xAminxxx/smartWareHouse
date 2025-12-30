"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, AuthUser } from "../../../lib/auth";
import { 
  Package, LogOut, LayoutDashboard, Database, Settings, 
  Menu, X, Bell, Search, Loader2, Plus, 
  Filter, Download, ChevronRight, Edit2, Trash2, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", stock: 0, price: 0 });
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (!auth || auth.role !== "admin") {
      router.push("/login");
    } else {
      setUser(auth);
    }
  }, [router]);

  const handleExportCSV = () => {
    if (inventory.length === 0) return;
    
    const headers = ["ID", "Nom", "Stock", "Prix (TND)"];
    const rows = inventory.map(item => [item.id, item.name, item.stock, item.price]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventaire_smartwh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/inventory");
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", stock: 0, price: 0 });
        fetchInventory();
      }
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/inventory/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingProduct(null);
        setFormData({ name: "", stock: 0, price: 0 });
        fetchInventory();
      }
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    try {
      const res = await fetch(`http://localhost:8000/inventory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInventory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({ name: product.name, stock: product.stock, price: product.price });
    setShowEditModal(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight">Smart<span className="text-blue-500">WH</span></span>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link href="/admin">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" sidebarOpen={sidebarOpen} />
          </Link>
          <Link href="/admin/inventory">
            <NavItem icon={<Package />} label="Inventaire" active sidebarOpen={sidebarOpen} />
          </Link>
          <Link href="/admin/settings">
            <NavItem icon={<Settings />} label="Paramètres" sidebarOpen={sidebarOpen} />
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
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
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-bold text-slate-400 hidden sm:block">Gestion des Stocks Temps Réel</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Base de données synchronisée</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-500/20 ring-2 ring-slate-800">
                {user.fullName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-custom">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">Inventory <span className="text-blue-500">Master</span></h2>
              <p className="text-slate-500 font-medium">Visualisation et gestion des ressources critiques</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-800 py-3 pl-10 pr-4 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all w-64 shadow-inner"
                />
              </div>
              <button 
                onClick={handleExportCSV}
                className="bg-slate-900 border border-slate-800 p-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 flex items-center gap-2 px-4 shadow-lg group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Exporter CSV</span>
              </button>
              <button 
                onClick={() => { setFormData({ name: "", stock: 0, price: 0 }); setShowAddModal(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 px-6"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Ajouter Produit</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Détails Produit</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quantité en Stock</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prix Unitaire</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-mono text-xs animate-pulse tracking-widest">FETCHING LIVE DATA...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredInventory.length > 0 ? (
                  filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <Package className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-black text-white text-lg tracking-tight uppercase group-hover:text-blue-400 transition-colors">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">SKU-{1000 + idx}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-end gap-2">
                          <span className={`text-2xl font-black ${item.stock < 20 ? 'text-red-500' : 'text-white'}`}>{item.stock}</span>
                          <span className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-widest">Unités</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.stock < 20 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-1000`} 
                            style={{ width: `${Math.min((item.stock/200)*100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-blue-400">{item.price} <span className="text-[10px] ml-1 uppercase">TND</span></span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          +1.2% ce mois
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-3 hover:bg-blue-600 rounded-xl transition-all group/btn"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500 group-hover/btn:text-white" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-3 hover:bg-red-600 rounded-xl transition-all group/btn"
                        >
                          <Trash2 className="w-4 h-4 text-slate-500 group-hover/btn:text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Package className="w-10 h-10 text-slate-700" />
                        <p className="text-slate-500 font-mono text-xs tracking-widest">AUCUN PRODUIT NE CORRESPOND À VOTRE RECHERCHE</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Product Modal (Add/Edit) */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight italic">
                {showAddModal ? "Ajouter" : "Modifier"} <span className="text-blue-500">Produit</span>
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAdd : handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom du Produit</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-800"
                  placeholder="ex: Claviers Mécaniques RGB"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantité Stock</label>
                  <input 
                    type="number" 
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Prix (TND)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {showAddModal ? "Confirmer l'ajout" : "Enregistrer les modifications"}
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
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}
    `}>
      <div className={`shrink-0 ${active ? 'text-white' : 'group-hover:text-blue-400'}`}>{icon}</div>
      {sidebarOpen && <span className="text-sm">{label}</span>}
    </div>
  );
}
