import React, { useState, useEffect, useMemo } from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import * as Lucide from 'https://esm.sh/lucide-react@0.460.0';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.37.0";

// --- Types ---
type ProductStatus = 'stocked' | 'needed';
interface Product {
  id: string;
  name: string;
  category: string;
  status: ProductStatus;
  quantity?: string;
}
const DEFAULT_CATEGORIES = ['Ovocie a zelenina', 'Pečivo', 'Mliečne výrobky', 'Mäso a údeniny', 'Trvanlivé potraviny', 'Nápoje', 'Drogéria', 'Ostatné'];

// --- Initial Data ---
const INITIAL_DATA: Product[] = [
  { id: '1', name: 'Mlieko', category: 'Mliečne výrobky', status: 'needed', quantity: '2ks' },
  { id: '2', name: 'Chlieb', category: 'Pečivo', status: 'needed', quantity: '1ks' }
];

// --- App Component ---
function App() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'inventory'>('shopping');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('sn-data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch { return INITIAL_DATA; }
  });
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sn-cats');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(categories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => localStorage.setItem('sn-data', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('sn-cats', JSON.stringify(categories)), [categories]);

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      quantity: newItemQuantity.trim() || undefined,
      category: newItemCategory,
      status: 'needed',
    };
    setProducts([...products, newProduct]);
    setNewItemName('');
    setNewItemQuantity('');
    setIsAddModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, status: p.status === 'needed' ? 'stocked' : 'needed' } : p));
  };

  const deleteProduct = (id: string) => {
    if (confirm('Zmazať?')) setProducts(products.filter(p => p.id !== id));
  };

  const handleAISearch = async () => {
    if (!searchQuery) return;
    try {
      const ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Čo uvariť z: ${searchQuery}? Máme aj: ${products.filter(p => p.status === 'stocked').map(p => p.name).join(', ')}. Odpovedaj stručne slovensky.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      setAiResponse(response.text || "");
    } catch (error) { alert("AI momentálne nedostupná."); }
  };

  const grouped = useMemo(() => {
    let filtered = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const g: Record<string, Product[]> = {};
    filtered.forEach(p => {
      if (!g[p.category]) g[p.category] = [];
      g[p.category].push(p);
    });
    return g;
  }, [activeTab, products, searchQuery]);

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-10">
      <header className="bg-emerald-600 text-white p-4 shadow-lg shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Nákupníček</h1>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2"><Lucide.Settings size={20} /></button>
        </div>
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-emerald-700 p-2 rounded-lg text-sm outline-none placeholder-emerald-200"
            placeholder="Hľadať / Recepty..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
          <button onClick={handleAISearch} className="bg-emerald-500 p-2 rounded-lg"><Lucide.ChefHat size={20} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {aiResponse && (
          <div className="bg-white p-4 rounded-xl border border-emerald-100 mb-4 text-sm relative">
            <button onClick={() => setAiResponse(null)} className="absolute top-2 right-2 text-gray-400">×</button>
            <p className="text-emerald-800 font-bold mb-1 italic">Tip od šéfkuchára:</p>
            {aiResponse}
          </div>
        )}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase mb-1">{cat}</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {items.map(p => (
                <div key={p.id} onClick={() => toggleStatus(p.id)} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 active:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${p.status === 'stocked' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                      {p.status === 'stocked' && <Lucide.Check size={14} className="text-white m-auto" />}
                    </div>
                    <span className={p.status === 'stocked' && activeTab === 'inventory' ? 'line-through text-gray-300' : ''}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{p.quantity}</span>
                    {activeTab === 'inventory' && <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} className="text-gray-200"><Lucide.Trash2 size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-20 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-xl"><Lucide.Plus size={24} /></button>

      <nav className="fixed bottom-0 w-full bg-white border-t flex h-16">
        <button onClick={() => setActiveTab('shopping')} className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'shopping' ? 'text-emerald-600' : 'text-gray-300'}`}>
          <Lucide.ShoppingCart size={20} /><span className="text-[10px]">Nákup</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'inventory' ? 'text-emerald-600' : 'text-gray-300'}`}>
          <Lucide.List size={20} /><span className="text-[10px]">Špajza</span>
        </button>
      </nav>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold mb-4">Pridať položku</h2>
            <form onSubmit={addProduct} className="space-y-3">
              <input autoFocus className="w-full bg-gray-50 p-3 rounded-xl outline-none" placeholder="Názov" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
              <input className="w-full bg-gray-50 p-3 rounded-xl outline-none" placeholder="Množstvo" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} />
              <select className="w-full bg-gray-50 p-3 rounded-xl outline-none" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Uložiť</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Render ---
const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
