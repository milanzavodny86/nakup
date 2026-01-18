
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './components/Icon';
import { Product, ProductStatus, DEFAULT_CATEGORIES, CategoryType } from './types';
// Fixed import to follow SDK guidelines
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
    const saved = localStorage.getItem('shopping-list-data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('shopping-list-categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('Ostatné');
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
    if (!categories.includes(newItemCategory)) {
        setNewItemCategory(categories[0] || 'Ostatné');
    }
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('shopping-list-cloud-url', cloudUrl);
  }, [cloudUrl]);

  useEffect(() => {
    if (cloudUrl && !lastSyncTime) {
      handleCloudDownload(true);
    }
  }, [cloudUrl]);

  const vibrate = () => {
    if (window.navigator && window.navigator.vibrate) {
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
          title: 'Môj nákupný zoznam',
          text: `Nákupný zoznam:\n${text}`,
        });
      } catch (err) {
        console.log('Zdieľanie zrušené');
      }
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

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    setNewItemName('');
    setNewItemQuantity('');
    setIsAddModalOpen(false);
    if (cloudUrl) handleCloudUpload(updatedProducts, true);
  };

  const toggleStatus = (id: string) => {
    vibrate();
    const updatedProducts = products.map(p => {
      if (p.id !== id) return p;
      return { ...p, status: p.status === 'needed' ? 'stocked' : 'needed' as ProductStatus };
    });
    setProducts(updatedProducts);
    if (cloudUrl) handleCloudUpload(updatedProducts, true);
  };

  const updateQuantity = (id: string, newQty: string) => {
    const updatedProducts = products.map(p => {
      if (p.id !== id) return p;
      return { ...p, quantity: newQty || undefined };
    });
    setProducts(updatedProducts);
  };

  const deleteProduct = (id: string) => {
    if (window.confirm('Vymazať produkt?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      if (cloudUrl) handleCloudUpload(updatedProducts, true);
    }
  };

  const addCategory = () => {
    if (!newCatName.trim() || categories.includes(newCatName.trim())) return;
    setCategories([...categories, newCatName.trim()]);
    setNewCatName('');
    vibrate();
  };

  const deleteCategory = (catToDelete: string) => {
    const hasProducts = products.some(p => p.category === catToDelete);
    if (hasProducts) {
      alert('Nemôžete zmazať kategóriu, ktorá obsahuje produkty.');
      return;
    }
    if (window.confirm(`Zmazať kategóriu "${catToDelete}"?`)) {
      setCategories(categories.filter(c => c !== catToDelete));
      vibrate();
    }
  };

  const handleCloudUpload = async (currentData: Product[] = products, silent = false) => {
    if (!cloudUrl) return;
    if (!silent) setIsSyncing(true);
    try {
      await fetch(cloudUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: currentData, categories })
      });
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (!silent) alert('Sync úspešný!');
    } catch (e) {
      if (!silent) alert('Chyba spojenia.');
    } finally {
      if (!silent) setIsSyncing(false);
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
      if (!silent) alert('Chyba sťahovania.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyData = () => {
    const backup = { products, categories };
    navigator.clipboard.writeText(JSON.stringify(backup)).then(() => alert('Skopírované!'));
  };

  const handleImportData = () => {
    try {
      const parsed = JSON.parse(importText);
      if (window.confirm('Prepísať všetky dáta?')) {
        if (parsed.products) setProducts(parsed.products);
        if (parsed.categories) setCategories(parsed.categories);
        setImportText('');
        alert('Dáta importované.');
      }
    } catch (e) { alert('Chybný formát.'); }
  };

  const handleAISearch = async () => {
    if (!searchQuery) return;
    setIsSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use generateContent with googleSearch tool
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `What can I cook with ${searchQuery}? Suggest simple recipes based on these ingredients: ${products.filter(p => p.status === 'stocked').map(p => p.name).join(', ')}`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      // Use response.text property directly
      setAiResponse(response.text || "No response generated.");
      
      // Fix: property is groundingMetadata, not groundMetadata
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        const sources = chunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
        setAiSources(sources);
      } else {
        setAiSources([]);
      }
    } catch (error) {
      console.error("AI Search failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const displayedProducts = useMemo(() => {
    let filtered = activeTab === 'shopping' ? products.filter(p => p.status === 'needed') : products;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, products, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    displayedProducts.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [displayedProducts]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans safe-area-inset">
      <header className="bg-emerald-600 text-white px-4 py-4 shadow-md z-10 shrink-0 space-y-3 pt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{activeTab === 'shopping' ? 'Nákup' : 'Špajza'}</h1>
          <div className="flex gap-1">
            <button onClick={handleShare} className="p-2 hover:bg-emerald-500 rounded-full"><Icons.Share2 size={24} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-emerald-500 rounded-full"><Icons.Settings size={24} /></button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200" size={18} />
            <input 
              type="text" placeholder="Hľadať..." 
              className="w-full bg-emerald-700 text-white placeholder-emerald-200 pl-10 pr-4 py-2 rounded-xl focus:outline-none"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAISearch} 
            disabled={isSyncing}
            className="bg-emerald-500 p-2 rounded-xl hover:bg-emerald-400 disabled:opacity-50"
          >
            <Icons.ChefHat size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {aiResponse && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl relative">
            <button onClick={() => setAiResponse(null)} className="absolute top-2 right-2 text-emerald-600"><Icons.X size={18} /></button>
            <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Icons.ChefHat size={16} /> AI Tip:</h3>
            <p className="text-sm text-emerald-900 whitespace-pre-wrap">{aiResponse}</p>
            {aiSources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Zdroje:</p>
                <div className="flex flex-wrap gap-2">
                  {aiSources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-700 underline truncate max-w-[150px]">
                      {s.title || 'Link'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {Object.entries(groupedProducts).length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic">Zoznam je prázdny...</div>
        ) : (
          Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{category}</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {items.map((product) => (
                  <div key={product.id} onClick={() => toggleStatus(product.id)} className={`flex items-center justify-between p-4 active:bg-gray-50 border-b border-gray-50`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${product.status === 'stocked' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {product.status === 'stocked' && <Icons.Check size={14} className="text-white" />}
                      </div>
                      <div className="flex flex-col">
                        <p className={`text-lg ${product.status === 'stocked' && activeTab === 'inventory' ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                          {product.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activeTab === 'inventory' ? (
                        <>
                          <input 
                            type="text" 
                            placeholder="ks/kg"
                            value={product.quantity || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateQuantity(product.id, e.target.value)}
                            onBlur={() => cloudUrl && handleCloudUpload(products, true)}
                            className="w-16 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-xs text-center text-gray-600 focus:border-emerald-500 outline-none"
                          />
                          <button onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }} className="p-2 text-gray-300"><Icons.Trash2 size={18} /></button>
                        </>
                      ) : (
                        product.quantity && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{product.quantity}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-24 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-xl active:scale-90 transition-transform z-20">
        <Icons.Plus size={28} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 pb-4 z-30">
        <button onClick={() => setActiveTab('shopping')} className={`flex flex-col items-center w-full ${activeTab === 'shopping' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Icons.ShoppingCart size={24} /><span className="text-xs mt-1">Nákup</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center w-full ${activeTab === 'inventory' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Icons.List size={24} /><span className="text-xs mt-1">Špajza</span>
        </button>
      </nav>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nový produkt</h2>
            <form onSubmit={addProduct} className="space-y-4">
              <div className="flex gap-2">
                <input autoFocus type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Názov..." className="flex-[2] bg-gray-100 p-4 rounded-xl text-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} placeholder="Počet..." className="flex-1 bg-gray-100 p-4 rounded-xl text-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full bg-gray-100 p-4 rounded-xl outline-none">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-emerald-200">Pridať</button>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nastavenia</h2>
              <button onClick={() => setIsSettingsOpen(false)}><Icons.X size={24} /></button>
            </div>
            
            <div className="space-y-6">
              {/* Správa kategórií */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Icons.List size={18} /> Správa kategórií
                </h3>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newCatName} 
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Nová kategória..." 
                        className="flex-1 p-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                    <button 
                        onClick={addCategory}
                        className="bg-blue-600 text-white px-3 rounded-lg text-sm font-bold"
                    >
                        Pridať
                    </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {categories.map(cat => (
                        <div key={cat} className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-50 text-sm">
                            <span className="text-gray-700">{cat}</span>
                            <button 
                                onClick={() => deleteCategory(cat)}
                                className="text-red-400 hover:text-red-600 p-1"
                            >
                                <Icons.Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Icons.Cloud size={18} /> Cloud Sync</h3>
                <input type="text" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} placeholder="URL..." className="w-full p-2 text-sm border rounded-lg mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => handleCloudUpload()} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">Upload</button>
                  <button onClick={() => handleCloudDownload()} className="flex-1 border border-emerald-600 text-emerald-600 py-2 rounded-lg text-sm">Download</button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-bold mb-2 flex items-center gap-2"><Icons.Save size={18} /> Manuálna záloha</h3>
                <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Sem vlož kód..." className="w-full h-20 bg-gray-50 border p-2 text-xs rounded-xl mb-2" />
                <div className="flex gap-2">
                  <button onClick={handleCopyData} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm">Kopírovať</button>
                  <button onClick={handleImportData} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm">Import</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
