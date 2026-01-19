
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

type ItemStatus = 'needed' | 'stocked';

interface Product {
  id: string;
  name: string;
  quantity: string;
  category: string;
  status: ItemStatus;
}

const CATEGORIES = ['🍎 Ovocie & Zelenina', '🥖 Pečivo', '🧀 Mliečne výrobky', '🥩 Mäso', '🍝 Trvanlivé', '🥤 Nápoje', '🧼 Drogéria', '✨ Ostatné'];

const App = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shopping' | 'all'>('shopping');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', category: CATEGORIES[0] });

  // Načítanie dát len z LocalStorage pre maximálnu stabilitu
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem('nakup_storage_v3');
        if (saved) {
          setProducts(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Chyba pri načítaní dát", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Ukladanie dát
  const saveData = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('nakup_storage_v3', JSON.stringify(newProducts));
  };

  const addProduct = () => {
    if (!newItem.name.trim()) return;
    const item: Product = {
      id: crypto.randomUUID(),
      name: newItem.name,
      quantity: newItem.quantity,
      category: newItem.category,
      status: 'needed'
    };
    saveData([...products, item]);
    setNewItem({ name: '', quantity: '', category: CATEGORIES[0] });
    setIsModalOpen(false);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const toggleStatus = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, status: (p.status === 'needed' ? 'stocked' : 'needed') as ItemStatus } : p);
    saveData(updated);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const deleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Odstrániť položku?')) {
      const updated = products.filter(p => p.id !== id);
      saveData(updated);
    }
  };

  const filteredList = useMemo(() => {
    const list = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    return [...list].sort((a, b) => a.category.localeCompare(b.category));
  }, [products, activeTab]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden border-x border-slate-200 shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Načítavam...</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-600 text-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-xl shadow-emerald-900/10 shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none uppercase italic">Nakup</h1>
            <p className="text-[10px] font-bold opacity-80 tracking-widest mt-1 uppercase">Môj zoznam</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 transition-all">
            <span className="text-xl font-black">{products.filter(p => p.status === 'needed').length}</span>
            <span className="text-xs opacity-60">🛒</span>
          </div>
        </div>
      </header>

      {/* List Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
        {filteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400 py-20">
            <div className="text-8xl mb-4 bg-slate-200 w-24 h-24 rounded-full flex items-center justify-center">🛍️</div>
            <p className="font-black uppercase tracking-widest text-sm text-center">Zoznam je prázdny</p>
            <p className="text-xs mt-2 text-center">Pridajte niečo pomocou tlačidla +</p>
          </div>
        ) : (
          filteredList.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleStatus(item.id)}
              className={`flex items-center justify-between p-5 rounded-3xl transition-all active:scale-[0.97] border shadow-sm ${
                item.status === 'stocked' ? 'bg-slate-100 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-colors ${
                  item.status === 'stocked' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'
                }`}>
                  {item.status === 'stocked' && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div>
                  <h3 className={`font-bold text-lg leading-tight ${item.status === 'stocked' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </h3>
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-tighter">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.quantity && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100">{item.quantity}</span>}
                <button 
                  onClick={(e) => deleteProduct(item.id, e)}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 text-2xl transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-600/40 flex items-center justify-center text-4xl font-light active:scale-90 transition-transform z-40 border-4 border-white"
      >
        <span className="mb-1">+</span>
      </button>

      {/* Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex pb-8 pt-4 px-6 gap-4 safe-area-inset-bottom z-30">
        <button 
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === 'shopping' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400'}`}
        >
          <span className="text-xl">🛒</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Kúpiť</span>
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400'}`}
        >
          <span className="text-xl">📦</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Zásoby</span>
        </button>
      </nav>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white w-full max-w-sm rounded-[3rem] p-8 animate-slide-up shadow-2xl mb-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
            <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tighter uppercase italic">Nová položka</h2>
            
            <div className="space-y-4">
              <input 
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 outline-none font-bold text-lg transition-all"
                placeholder="Čo treba kúpiť?"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  className="w-24 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 outline-none font-bold text-center"
                  placeholder="Mn."
                  value={newItem.quantity}
                  onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                />
                <select 
                  className="flex-1 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 outline-none font-bold text-emerald-600 appearance-none"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button 
                onClick={addProduct}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 active:scale-95 transition-all mt-4 border-b-4 border-emerald-800"
              >
                Pridať do zoznamu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
