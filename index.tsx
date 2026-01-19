
// Added React and ReactDOM imports to fix UMD global reference errors
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const CATEGORIES = ["🥦 Potraviny", "🧼 Drogéria", "🏠 Domácnosť", "🐶 Maznáčikovia", "🛠️ Iné"];

const App = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: CATEGORIES[0] });

  // Načítanie z LocalStorage pri štarte
  useEffect(() => {
    const saved = localStorage.getItem('nakup_items_v1');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Nepodarilo sa načítať dáta", e);
      }
    }
  }, []);

  // Uloženie do LocalStorage pri každej zmene
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
    const updated = items.filter(i => i.id !== id);
    updateItems(updated);
  };

  const clearBought = () => {
    if (confirm("Odstrániť všetky kúpené položky?")) {
      const updated = items.filter(i => i.status === 'needed');
      updateItems(updated);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-blue-600 p-6 pt-12 pb-8 rounded-b-[2rem] shadow-lg shrink-0 z-10">
        <div className="flex justify-between items-start text-white">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Nákup</h1>
            <p className="text-[10px] font-bold mt-2 opacity-80 tracking-widest uppercase">Miestne úložisko</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black backdrop-blur-md border border-white/10">
              {items.filter(i => i.status === 'needed').length} POLOŽIEK
            </div>
            {items.some(i => i.status === 'bought') && (
              <button 
                onClick={clearBought}
                className="text-[10px] font-bold underline opacity-70 active:opacity-100"
              >
                VYMAZAŤ KÚPENÉ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32 bg-slate-50">
        {items.length === 0 ? (
          <div className="text-center py-32 animate-pulse">
            <div className="text-7xl mb-6">🛒</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Váš zoznam je prázdny</p>
            <p className="text-slate-300 text-[10px] mt-2 font-medium px-10 leading-relaxed text-center">
              Pridajte produkty, ktoré potrebujete nakúpiť, pomocou tlačidla plus dole.
            </p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] select-none ${
                item.status === 'bought' 
                  ? 'bg-white/40 border-transparent grayscale' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  item.status === 'bought' 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-slate-300'
                }`}>
                  {item.status === 'bought' && <span className="text-xs font-bold">✓</span>}
                </div>
                <div>
                  <p className={`font-bold text-lg leading-none ${item.status === 'bought' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${item.status === 'bought' ? 'text-slate-300' : 'text-blue-500'}`}>
                    {item.category}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => deleteItem(item.id, e)} 
                className="text-slate-300 hover:text-red-400 text-3xl px-2 leading-none transition-colors"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-4xl border-4 border-white active:scale-90 transition-transform z-40"
      >
        +
      </button>

      {/* Modal - Add Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end transition-opacity" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white w-full p-8 rounded-t-[3rem] shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-2"></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Nový produkt</h2>
            
            <div className="space-y-4">
              <input 
                autoFocus
                className="w-full bg-slate-50 p-5 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 font-bold text-xl placeholder:text-slate-300 border border-slate-100"
                placeholder="Názov (napr. Mlieko)"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewItem({...newItem, category: c})}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                      newItem.category === c 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                        : 'bg-white text-slate-600 border-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button 
                onClick={addItem}
                disabled={!newItem.name.trim()}
                className="w-full bg-blue-600 disabled:bg-slate-300 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-600/20 text-lg"
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

// Fixed ReactDOM.createRoot by importing createRoot from react-dom/client
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
