import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './components/Icon';
import { Product, ProductStatus, DEFAULT_CATEGORIES } from './types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const INITIAL_DATA: Product[] = [
  { id: '1', name: 'Mlieko', category: 'Mliečne výrobky', status: 'needed', quantity: '2ks' },
  { id: '2', name: 'Chlieb', category: 'Pečivo', status: 'needed', quantity: '1ks' },
  { id: '3', name: 'Vajíčka', category: 'Mliečne výrobky', status: 'stocked', quantity: '10ks' },
  { id: '4', name: 'Jablká', category: 'Ovocie a zelenina', status: 'stocked', quantity: '1kg' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'inventory'>('shopping');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shopping-list-data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch { return INITIAL_DATA; }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shopping-list-categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [newCatName, setNewCatName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [importText, setImportText] = useState('');
  const [cloudUrl, setCloudUrl] = useState(() => localStorage.getItem('shopping-list-cloud-url') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<{title?: string, uri?: string}[]>([]);

  useEffect(() => {
    localStorage.setItem('shopping-list-data', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shopping-list-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('shopping-list-cloud-url', cloudUrl);
    if (cloudUrl && !lastSyncTime) {
      handleCloudDownload(true);
    }
  }, [cloudUrl]);

  const vibrate = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleShare = async () => {
    const text = products
      .filter(p => p.status === 'needed')
      .map(p => `• ${p.name}${p.quantity ? ` (${p.quantity})` : ''}`)
      .join('\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nákupný zoznam',
          text: `Môj nákupný zoznam:\n${text}`,
        });
      } catch (err) { /* ignore */ }
    } else {
      handleCopyData();
    }
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    vibrate();

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      quantity: newItemQuantity.trim() || undefined,
      category: newItemCategory,
      status: 'needed',
    };

    const updated = [...products, newProduct];
    setProducts(updated);
    setNewItemName('');
    setNewItemQuantity('');
    setIsAddModalOpen(false);
    if (cloudUrl) handleCloudUpload(updated, true);
  };

  const toggleStatus = (id: string) => {
    vibrate();
    const updated = products.map(p => p.id === id ? { ...p, status: p.status === 'needed' ? 'stocked' : 'needed' as ProductStatus } : p);
    setProducts(updated);
    if (cloudUrl) handleCloudUpload(updated, true);
  };

  const updateQuantity = (id: string, newQty: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, quantity: newQty || undefined } : p));
  };

  const deleteProduct = (id: string) => {
    if (confirm('Vymazať produkt?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      if (cloudUrl) handleCloudUpload(updated, true);
    }
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    setCategories([...categories, name]);
    setNewCatName('');
    vibrate();
  };

  const deleteCategory = (catToDelete: string) => {
    if (products.some(p => p.category === catToDelete)) {
      alert('Kategória obsahuje produkty.');
      return;
    }
    if (confirm(`Zmazať "${catToDelete}"?`)) {
      setCategories(categories.filter(c => c !== catToDelete));
    }
  };

  const handleCloudUpload = async (currentData = products, silent = false) => {
    if (!cloudUrl) return;
    if (!silent) setIsSyncing(true);
    try {
      await fetch(cloudUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ products: currentData, categories })
      });
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      if (!silent) alert('Sync zlyhal.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudDownload = async (silent = false) => {
    if (!cloudUrl) return;
    setIsSyncing(true);
    try {
      const response = await fetch(cloudUrl);
      const data = await response.json();
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      if (!silent) alert('Download zlyhal.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyData = () => {
    const backup = { products, categories };
    navigator.clipboard.writeText(JSON.stringify(backup)).then(() => alert('Skopírované do schránky.'));
  };

  const handleImportData = () => {
    try {
      const parsed = JSON.parse(importText);
      if (confirm('Prepísať všetky dáta?')) {
        if (parsed.products) setProducts(parsed.products);
        if (parsed.categories) setCategories(parsed.categories);
        setImportText('');
        alert('Import hotový.');
      }
    } catch (e) { alert('Chybný formát.'); }
  };

  // Fix: Correct usage of GoogleGenAI and search grounding
  const handleAISearch = async () => {
    if (!searchQuery) return;
    setIsSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Čo môžem uvariť z: ${searchQuery}? Máme aj: ${products.filter(p => p.status === 'stocked').map(p => p.name).join(', ')}. Odpovedaj stručne v slovenčine.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      setAiResponse(response.text || "");
      // Fix: Safely access and cast grounding chunks
      const metadata = response.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        const chunks = metadata.groundingChunks as any[];
        setAiSources(chunks.filter((c) => c.web).map((c) => ({ title: c.web.title, uri: c.web.uri })));
      } else {
        setAiSources([]);
      }
    } catch (error) {
      console.error(error);
      alert("AI momentálne nedostupná.");
    } finally {
      setIsSyncing(false);
    }
  };

  const groupedProducts = useMemo(() => {
    let filtered = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const groups: Record<string, Product[]> = {};
    filtered.sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [activeTab, products, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans safe-area-inset">
      <header className="bg-emerald-600 text-white px-4 pb-4 pt-12 shadow-md z-10 shrink-0 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{activeTab === 'shopping' ? 'Nákup' : 'Špajza'}</h1>
          <div className="flex gap-1">
            <button onClick={handleShare} className="p-2 active:bg-emerald-500 rounded-full"><Icons.Share2 size={22} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 active:bg-emerald-500 rounded-full"><Icons.Settings size={22} /></button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200" size={18} />
            <input 
              type="text" placeholder="Hľadať alebo recepty..." 
              className="w-full bg-emerald-700 text-white placeholder-emerald-200 pl-10 pr-4 py-2 rounded-xl focus:outline-none text-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleAISearch} disabled={isSyncing} className="bg-emerald-500 p-2 rounded-xl active:bg-emerald-400 disabled:opacity-50">
            <Icons.ChefHat size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {aiResponse && (
          <div className="mb-6 p-4 bg-white border border-emerald-100 rounded-2xl relative shadow-sm">
            <button onClick={() => setAiResponse(null)} className="absolute top-2 right-2 text-gray-400"><Icons.X size={18} /></button>
            <h3 className="font-bold text-emerald-700 mb-2 flex items-center gap-2 text-sm"><Icons.ChefHat size={16} /> Nápad na varenie:</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            {aiSources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                {aiSources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 underline truncate max-w-[120px]">{s.title || 'Zdroj'}</a>
                ))}
              </div>
            )}
          </div>
        )}

        {Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic text-sm">Zatiaľ tu nič nie je...</div>
        ) : (
          Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{category}</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {items.map((product) => (
                  <div key={product.id} onClick={() => toggleStatus(product.id)} className="flex items-center justify-between p-4 active:bg-gray-50 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${product.status === 'stocked' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                        {product.status === 'stocked' && <Icons.Check size={12} className="text-white" />}
                      </div>
                      <span className={`text-base ${product.status === 'stocked' && activeTab === 'inventory' ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                        {product.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {activeTab === 'inventory' ? (
                        <>
                          <input 
                            type="text" value={product.quantity || ''} placeholder="ks"
                            onChange={(e) => updateQuantity(product.id, e.target.value)}
                            onBlur={() => cloudUrl && handleCloudUpload(products, true)}
                            className="w-12 bg-gray-50 border border-gray-100 rounded py-1 text-[10px] text-center"
                          />
                          <button onClick={() => deleteProduct(product.id)} className="p-1 text-gray-200"><Icons.Trash2 size={16} /></button>
                        </>
                      ) : (
                        product.quantity && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">{product.quantity}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-24 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-lg active:scale-95 transition-transform z-20">
        <Icons.Plus size={24} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 pb-2 z-30">
        <button onClick={() => setActiveTab('shopping')} className={`flex flex-col items-center w-full transition-colors ${activeTab === 'shopping' ? 'text-emerald-600' : 'text-gray-300'}`}>
          <Icons.ShoppingCart size={20} /><span className="text-[10px] mt-1 font-medium">Nákup</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center w-full transition-colors ${activeTab === 'inventory' ? 'text-emerald-600' : 'text-gray-300'}`}>
          <Icons.List size={20} /><span className="text-[10px] mt-1 font-medium">Špajza</span>
        </button>
      </nav>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Pridať položku</h2>
            <form onSubmit={addProduct} className="space-y-4">
              <div className="flex gap-2">
                <input autoFocus type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Názov..." className="flex-[2] bg-gray-50 p-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500" />
                <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} placeholder="Množstvo" className="flex-1 bg-gray-50 p-3 rounded-xl outline-none" />
              </div>
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl outline-none appearance-none">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md">Uložiť</button>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 overflow-y-auto max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Nastavenia</h2>
              <button onClick={() => setIsSettingsOpen(false)}><Icons.X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase">Synchronizácia (Apps Script)</label>
                <input type="text" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} placeholder="https://script.google.com/..." className="w-full p-3 text-xs border rounded-xl" />
                <div className="flex gap-2">
                  <button onClick={() => handleCloudUpload()} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold">Odoslať</button>
                  <button onClick={() => handleCloudDownload()} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs font-bold">Stiahnuť</button>
                </div>
              </div>
              <div className="space-y-3 border-t pt-4">
                <label className="text-xs font-bold text-gray-400 uppercase">Kategórie</label>
                <div className="flex gap-2">
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nová..." className="flex-1 p-2 text-xs border rounded-lg" />
                  <button onClick={addCategory} className="bg-emerald-100 text-emerald-700 px-3 rounded-lg text-xs font-bold">Pridať</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 text-[10px]">
                      {cat}
                      <button onClick={() => deleteCategory(cat)} className="text-red-300 ml-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}