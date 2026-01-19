// Added imports to resolve UMD global errors and satisfy module requirements
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// SEM VLOŽÍTE URL PO NASADENÍ GOOGLE APPS SCRIPTU
const GAS_URL = "https://script.google.com/macros/s/AKfycbw1qbHumkCDiGnv9E5lQ5l1_GkkhWT227tc8-ymUlqktZCYo2AAOwoaPTzwAMc-QA6tDA/exec";

const CATEGORIES = ["🥦 Potraviny", "🧼 Drogéria", "🏠 Domácnosť", "🐶 Maznáčikovia"];

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: CATEGORIES[0] });

  // Načítanie pri štarte
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (GAS_URL === "https://script.google.com/macros/s/AKfycbw1qbHumkCDiGnv9E5lQ5l1_GkkhWT227tc8-ymUlqktZCYo2AAOwoaPTzwAMc-QA6tDA/exec") {
      const saved = localStorage.getItem('local_items');
      if (saved) setItems(JSON.parse(saved));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(GAS_URL);
      const data = await res.json();
      setItems(data.products || []);
    } catch (err) {
      console.error("Chyba načítania:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async (newItems) => {
    setItems(newItems);
    localStorage.setItem('local_items', JSON.stringify(newItems));

    if (GAS_URL !== "https://script.google.com/macros/s/AKfycbw1qbHumkCDiGnv9E5lQ5l1_GkkhWT227tc8-ymUlqktZCYo2AAOwoaPTzwAMc-QA6tDA/exec") {
      try {
        await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify({ products: newItems }),
          mode: "no-cors" // Pre Google Apps Script POST
        });
      } catch (err) {
        console.error("Chyba synchronizácie:", err);
      }
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
    const updated = items.filter(i => i.id !== id);
    syncData(updated);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-blue-600 p-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center text-white">
          <h1 className="text-2xl font-extrabold tracking-tight italic uppercase">Nákup</h1>
          {loading && <div className="animate-spin text-xl">⏳</div>}
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
            {items.filter(i => i.status === 'needed').length} POLOŽIEK
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-sm font-semibold uppercase tracking-widest">Zoznam je prázdny</p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 ${
                item.status === 'bought' ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  item.status === 'bought' ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'
                }`}>
                  {item.status === 'bought' && "✓"}
                </div>
                <div>
                  <p className={`font-bold ${item.status === 'bought' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">{item.category}</p>
                </div>
              </div>
              <button onClick={(e) => deleteItem(item.id, e)} className="text-slate-300 text-2xl px-2">&times;</button>
            </div>
          ))
        )}
      </div>

      {/* FAB button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-6 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-4xl border-4 border-white active:scale-90 transition-transform"
      >
        +
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full p-8 rounded-t-[2.5rem] shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800">Pridať položku</h2>
            <input 
              autoFocus
              className="w-full bg-slate-100 p-4 rounded-xl outline-none focus:ring-2 ring-blue-500 font-semibold"
              placeholder="Názov produktu..."
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            <select 
              className="w-full bg-slate-100 p-4 rounded-xl outline-none font-semibold"
              value={newItem.category}
              onChange={e => setNewItem({...newItem, category: e.target.value})}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button 
              onClick={addItem}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95"
            >
              Uložiť
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Fixed to use the standard createRoot API from react-dom/client
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);