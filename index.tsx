
// Fix: Added explicit imports to satisfy module requirements and provide type definitions
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const CATEGORIES = ["🥦 Potraviny", "🧼 Drogéria", "🏠 Domácnosť", "🐶 Maznáčikovia", "🛠️ Iné"];

const App = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: CATEGORIES[0] });

  // Načítanie pri štarte z LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('nakup_items_v1');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Chyba načítania dát", e);
      }
    }
  }, []);

  const updateItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('nakup_items_v1', JSON.stringify(newItems));
  };

  const addItem = () => {
    if (!newItem.name.trim()) return;
    const updated = [
      { ...newItem, id: Date.now(), status: "needed" },
      ...items
    ];
    updateItems(updated);
    setNewItem({ name: "", category: CATEGORIES[0] });
    setIsModalOpen(false);
  };

  const toggleItem = (id) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, status: item.status === "needed" ? "bought" : "needed" } : item
    );
    updateItems(updated);
  };

  const deleteItem = (id, e) => {
    e.stopPropagation();
    if (confirm("Odstrániť túto položku?")) {
      const updated = items.filter(i => i.id !== id);
      updateItems(updated);
    }
  };

  const clearBought = () => {
    if (confirm("Odstrániť všetky kúpené položky zo zoznamu?")) {
      const updated = items.filter(i => i.status === 'needed');
      updateItems(updated);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-blue-600 p-6 pt-12 pb-8 rounded-b-[2rem] shadow-lg shrink-0 z-10 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Nákup</h1>
            <p className="text-[10px] font-bold mt-2 opacity-80 tracking-widest uppercase">Lokálne Úložisko</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black backdrop-blur-md border border-white/10">
              {items.filter(i => i.status === 'needed').length} POLOŽIEK
            </div>
            {items.some(i => i.status === 'bought') && (
              <button onClick={clearBought} className="text-[10px] font-bold underline opacity-70 active:opacity-100">
                VYMAZAŤ KÚPENÉ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32 bg-slate-50">
        {items.length === 0 ? (
          <div className="text-center py-32 opacity-30 italic font-bold">Váš zoznam je prázdny...</div>
        ) : (
          items.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer ${
                item.status === 'bought' ? 'bg-slate-100 border-transparent opacity-50' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.status === 'bought' ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'
                }`}>
                  {item.status === 'bought' && <span className="text-xs">✓</span>}
                </div>
                <div>
                  <p className={`font-bold text-lg leading-none ${item.status === 'bought' ? 'line-through' : 'text-slate-800'}`}>
                    {item.name}
                  </p>
                  <p className="text-[10px] font-black text-blue-500 uppercase mt-1 tracking-tighter">{item.category}</p>
                </div>
              </div>
              <button 
                onClick={(e) => deleteItem(item.id, e)} 
                className="text-slate-300 hover:text-red-500 text-3xl px-2 leading-none"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-4xl border-4 border-white active:scale-90 transition-transform z-40"
      >
        +
      </button>

      {/* Modal - Pridanie položky */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full p-8 rounded-t-[3rem] shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-2"></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Nový produkt</h2>
            
            <input 
              autoFocus
              className="w-full bg-slate-50 p-5 rounded-2xl outline-none border border-slate-100 font-bold text-xl focus:ring-4 ring-blue-500/10"
              placeholder="Názov produktu..."
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setNewItem({...newItem, category: c})}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                    newItem.category === c ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button 
              onClick={addItem}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-transform text-lg"
            >
              Pridať do zoznamu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Spustenie aplikácie cez globálny ReactDOM
// Fix: Using ReactDOM.createRoot from the 'react-dom/client' import
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);