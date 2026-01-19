import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// URL z Google Apps Scriptu (Deployment URL)
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbw1qbHumkCDiGnv9E5lQ5l1_GkkhWT227tc8-ymUlqktZCYo2AAOwoaPTzwAMc-QA6tDA/exec';

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

  // Načítanie dát pri štarte (Cloud + Local backup)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Najprv skúsime načítat lokálne dáta, aby sme nemali bielu obrazovku
      const saved = localStorage.getItem('household_items_v2');
      if (saved) {
        try {
          setProducts(JSON.parse(saved));
        } catch (e) {
          console.error("Local data parse error", e);
        }
      }

      try {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data && data.products) {
          setProducts(data.products);
          localStorage.setItem('household_items_v2', JSON.stringify(data.products));
        }
      } catch (e) {
        console.error("Cloud sync failed, using local data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Funkcia na ukladanie do cloudu aj lokálne
  const syncData = async (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('household_items_v2', JSON.stringify(newProducts));
    
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: newProducts })
      });
    } catch (e) {
      console.error("Sync error", e);
    }
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
    syncData([...products, item]);
    setNewItem({ name: '', quantity: '', category: CATEGORIES[0] });
    setIsModalOpen(false);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const toggleStatus = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, status: (p.status === 'needed' ? 'stocked' : 'needed') as ItemStatus } : p);
    syncData(updated);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const deleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Odstrániť položku?')) {
      const updated = products.filter(p => p.id !== id);
      syncData(updated);
    }
  };

  const filteredList = useMemo(() => {
    const list = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    return [...list].sort((a, b) => a.category.localeCompare(b.category));
  }, [products, activeTab]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden">
      {isLoading && products.length === 0 && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Načítavam Nakup...</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-600 text-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-xl shadow-emerald-900/10 shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter leading-none uppercase">Nakup</h1>
            <p className="text-[10px] font-semibold opacity-70 tracking-widest mt-1 uppercase">Zdieľaný zoznam</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="text-xl font-black">{products.filter(p => p.status === 'needed').length}</span>
            <span className="text-xs opacity-60">🔄</span>
          </button>
        </div>
      </header>

      {/* List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
        {filteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 py-20">
            <span className="text-8xl mb-4">🛒</span>
            <p className="font-bold uppercase tracking-widest text-sm text-center">Zoznam je prázdny</p>
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
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  item.status === 'stocked' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'
                }`}>
                  {item.status === 'stocked' && <span className="text-white text-[10px]">✓</span>}
                </div>
                <div>
                  <h3 className={`font-bold text-lg leading-tight ${item.status === 'stocked' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </h3>
                  <p className="text-[10px] font-extrabold text-emerald-600/50 uppercase">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.quantity && <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">{item.quantity}</span>}
                <button 
                  onClick={(e) => deleteProduct(item.id, e)}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 text-xl"
                >
                  &times;
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* FAB - Pridať */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-600/40 flex items-center justify-center text-4xl font-light active:scale-90 transition-transform z-40"
      >
        +
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex pb-8 pt-4 px-6 gap-4 safe-area-inset-bottom z-30">
        <button 
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === 'shopping' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400'}`}
        >
          <span className="text-xl">🛍️</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Košík</span>
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Všetko</span>
        </button>
      </nav>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 animate-slide-up shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight uppercase">Pridať vec</h2>
            
            <div className="space-y-4">
              <input 
                autoFocus
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold text-lg transition-all"
                placeholder="Názov"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  className="w-24 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold text-center"
                  placeholder="Mn."
                  value={newItem.quantity}
                  onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                />
                <select 
                  className="flex-1 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold text-emerald-600 appearance-none"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button 
                onClick={addProduct}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 active:scale-95 transition-transform mt-4"
              >
                Uložiť
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