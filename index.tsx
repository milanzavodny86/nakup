
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

const CATEGORIES = ['🍎 Ovocie', '🥖 Pečivo', '🧀 Mliečne', '🥩 Mäso', '🍝 Trvanlivé', '🥤 Nápoje', '🧼 Drogéria', '✨ Ostatné'];

const App = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('shopping');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', category: CATEGORIES[0] });

  useEffect(() => {
    const saved = localStorage.getItem('nakup_v4_data');
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  const saveData = (newProducts) => {
    setProducts(newProducts);
    localStorage.setItem('nakup_v4_data', JSON.stringify(newProducts));
  };

  const addProduct = () => {
    if (!newItem.name.trim()) return;
    const item = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      quantity: newItem.quantity.trim(),
      category: newItem.category,
      status: 'needed'
    };
    saveData([...products, item]);
    setNewItem({ name: '', quantity: '', category: CATEGORIES[0] });
    setIsModalOpen(false);
  };

  const toggleStatus = (id) => {
    saveData(products.map(p => p.id === id ? { ...p, status: p.status === 'needed' ? 'stocked' : 'needed' } : p));
  };

  const deleteProduct = (id, e) => {
    e.stopPropagation();
    if (confirm('Odstrániť?')) {
      saveData(products.filter(p => p.id !== id));
    }
  };

  const filteredList = useMemo(() => {
    const list = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    return [...list].sort((a, b) => a.category.localeCompare(b.category));
  }, [products, activeTab]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden">
      <header className="bg-emerald-600 text-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-xl shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">NÁKUP</h1>
            <p className="text-[10px] font-bold opacity-60 tracking-widest mt-1 uppercase">VERZIA 4.0.0-APP</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2">
            <span className="font-black text-xl">{products.filter(p => p.status === 'needed').length}</span>
            <span>🛒</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
        {filteredList.length === 0 ? (
          <div className="py-24 text-center opacity-30">
            <div className="text-6xl mb-4">🛒</div>
            <p className="font-bold uppercase text-[10px] tracking-widest">Všetko nakúpené</p>
          </div>
        ) : (
          filteredList.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleStatus(item.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 ${
                item.status === 'stocked' ? 'bg-slate-100 border-transparent opacity-50' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.status === 'stocked' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                }`}>
                  {item.status === 'stocked' && "✓"}
                </div>
                <div>
                  <h3 className={`font-bold text-slate-800 ${item.status === 'stocked' ? 'line-through' : ''}`}>{item.name}</h3>
                  <span className="text-[8px] font-black uppercase text-emerald-600">{item.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.quantity && <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold">{item.quantity}</span>}
                <button onClick={(e) => deleteProduct(item.id, e)} className="text-slate-300 px-2 text-xl">&times;</button>
              </div>
            </div>
          ))
        )}
      </main>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-4xl z-40 border-4 border-white active:scale-90"
      >
        +
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex pb-8 pt-4 px-6 gap-4 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('shopping')} className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-colors ${activeTab === 'shopping' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>
          <span className="text-xl">🛒</span>
          <span className="text-[9px] font-black uppercase">Kúpiť</span>
        </button>
        <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-colors ${activeTab === 'all' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>
          <span className="text-xl">📦</span>
          <span className="text-[9px] font-black uppercase">Všetko</span>
        </button>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full rounded-t-[2.5rem] p-8 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Nová položka</h2>
            <div className="space-y-4">
              <input autoFocus className="w-full bg-slate-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-lg" placeholder="Názov produktu" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <div className="flex gap-2">
                <input className="w-24 bg-slate-50 p-4 rounded-2xl outline-none text-center font-bold border-2 border-transparent focus:border-emerald-500" placeholder="Mn." value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
                <select className="flex-1 bg-slate-50 p-4 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-emerald-500 appearance-none text-emerald-600" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addProduct} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform mt-2">
                Pridať do zoznamu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Use ReactDOM from 'react-dom/client' to access createRoot
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);