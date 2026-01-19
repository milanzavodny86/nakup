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
  const [activeTab, setActiveTab] = useState<'shopping' | 'all'>('shopping');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', category: CATEGORIES[0] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nakup_storage_final');
      if (saved) {
        setProducts(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Storage error", e);
    }
  }, []);

  const saveData = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('nakup_storage_final', JSON.stringify(newProducts));
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
  };

  const toggleStatus = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, status: (p.status === 'needed' ? 'stocked' : 'needed') as ItemStatus } : p);
    saveData(updated);
  };

  const deleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Odstrániť?')) {
      const updated = products.filter(p => p.id !== id);
      saveData(updated);
    }
  };

  const filteredList = useMemo(() => {
    const list = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    return [...list].sort((a, b) => a.category.localeCompare(b.category));
  }, [products, activeTab]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden">
      <header className="bg-emerald-600 text-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-lg shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Nakup</h1>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Môj zoznam</p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            <span className="text-xl font-black">{products.filter(p => p.status === 'needed').length}</span>
            <span className="text-sm">🛒</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
        {filteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 py-20">
            <div className="text-7xl mb-4">🛍️</div>
            <p className="font-bold uppercase tracking-widest text-xs">Prazdny zoznam</p>
          </div>
        ) : (
          filteredList.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleStatus(item.id)}
              className={`flex items-center justify-between p-5 rounded-3xl transition-all active:scale-[0.98] border ${
                item.status === 'stocked' ? 'bg-slate-100 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                  item.status === 'stocked' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'
                }`}>
                  {item.status === 'stocked' && "✓"}
                </div>
                <div>
                  <h3 className={`font-bold text-lg leading-tight ${item.status === 'stocked' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </h3>
                  <p className="text-[9px] font-black text-emerald-600/60 uppercase">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.quantity && <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">{item.quantity}</span>}
                <button onClick={(e) => deleteProduct(item.id, e)} className="text-slate-300 text-2xl px-2">&times;</button>
              </div>
            </div>
          ))
        )}
      </main>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-center text-4xl z-40 border-4 border-white"
      >
        +
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex pb-8 pt-4 px-6 gap-4 z-30">
        <button 
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 ${activeTab === 'shopping' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
        >
          <span className="text-xl font-bold">🛒</span>
          <span className="text-[10px] font-black uppercase">Kúpiť</span>
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 ${activeTab === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
        >
          <span className="text-xl font-bold">📦</span>
          <span className="text-[10px] font-black uppercase">Zásoby</span>
        </button>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 animate-slide-up shadow-2xl mb-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase italic">Pridať</h2>
            <div className="space-y-4">
              <input 
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold"
                placeholder="Názov"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  className="w-20 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold text-center"
                  placeholder="Mn."
                  value={newItem.quantity}
                  onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                />
                <select 
                  className="flex-1 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold text-emerald-600 appearance-none"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addProduct} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">Pridať</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);