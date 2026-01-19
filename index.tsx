
// Pridané importy pre vyriešenie chýb modulov a typov
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const GAS_URL = "https://script.google.com/macros/s/AKfycbw1qbHumkCDiGnv9E5lQ5l1_GkkhWT227tc8-ymUlqktZCYo2AAOwoaPTzwAMc-QA6tDA/exec";
const CATEGORIES = ["🥦 Potraviny", "🧼 Drogéria", "🏠 Domácnosť", "🐶 Maznáčikovia"];

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: CATEGORIES[0] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Najprv skúsime lokálne dáta pre okamžitý štart
    const saved = localStorage.getItem('local_items');
    if (saved) setItems(JSON.parse(saved));

    if (!GAS_URL.includes("macros/s/")) return;

    setLoading(true);
    try {
      const res = await fetch(GAS_URL);
      const data = await res.json();
      if (data && data.products) {
        setItems(data.products);
        localStorage.setItem('local_items', JSON.stringify(data.products));
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async (newItems) => {
    setItems(newItems);
    localStorage.setItem('local_items', JSON.stringify(newItems));

    if (!GAS_URL.includes("macros/s/")) return;

    try {
      await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ products: newItems }),
        mode: "no-cors"
      });
    } catch (err) {
      console.error("Post error:", err);
    }
  };

  const addItem = () => {
    if (!newItem.name.trim()) return;
    const updated = [...items, { ...newItem, id: Date.now(), status: "needed" }];
    syncData(updated);
    setNewItem({ name: "", category: CATEGORIES[0] });
    setIsModalOpen(false);
  };

  const toggleItem = (id) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, status: item.status === "needed" ? "bought" : "needed" } : item
    );
    syncData(updated);
  };

  const deleteItem = (id, e) => {
    e.stopPropagation();
    if (confirm("Odstrániť túto položku?")) {
      const updated = items.filter(i => i.id !== id);
      syncData(updated);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-xl">
      <div className="bg-blue-600 p-6 pt-12 pb-8 rounded-b-3xl shadow-lg shrink-0">
        <div className="flex justify-between items-center text-white">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight italic uppercase leading-none">Nákup</h1>
            <p className="text-[10px] opacity-60 font-bold mt-1 tracking-widest">GOOGLE SYNC ACTIVE</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && <div className="animate-spin text-xl">⏳</div>}
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              {items.filter(i => i.status === 'needed').length} KS
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
        {items.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-sm font-bold uppercase tracking-widest">Zoznam je prázdny</p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 select-none ${
                item.status === 'bought' ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.status === 'bought' ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'
                }`}>
                  {item.status === 'bought' && <span className="text-[10px] font-bold">✓</span>}
                </div>
                <div>
                  <p className={`font-bold text-lg leading-tight ${item.status === 'bought' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{item.category}</p>
                </div>
              </div>
              <button onClick={(e) => deleteItem(item.id, e)} className="text-slate-300 text-3xl px-2 leading-none">&times;</button>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-6 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-4xl border-4 border-white active:scale-90 transition-transform z-40"
      >
        +
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full p-8 rounded-t-[2.5rem] shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">Pridať položku</h2>
            <input 
              autoFocus
              className="w-full bg-slate-100 p-4 rounded-2xl outline-none focus:ring-4 ring-blue-500/20 font-bold text-lg"
              placeholder="Názov (napr. Chlieb)"
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
              onKeyPress={e => e.key === 'Enter' && addItem()}
            />
            <div className="relative">
              <select 
                className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-bold appearance-none text-blue-600"
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
            </div>
            <button 
              onClick={addItem}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-blue-600/30"
            >
              Uložiť do zoznamu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Oprava pre volanie createRoot na ReactDOM z react-dom/client
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
