
import React, { useEffect, useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { getHistory, deleteFromHistory } from '../services/historyService';

interface Props {
  onSelect: (item: HistoryItem) => void;
  onBack: () => void;
  onCompare: (items: HistoryItem[]) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';

const HistoryView: React.FC<Props> = ({ onSelect, onBack, onCompare }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('آیا از حذف این گزارش مطمئن هستید؟')) {
      const updated = deleteFromHistory(id);
      setItems(updated);
      setSelectedForCompare(prev => prev.filter(i => i !== id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedForCompare(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    if (minScoreFilter > 0) result = result.filter(item => item.healthScore >= minScoreFilter);
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc': return b.timestamp - a.timestamp;
        case 'date-asc': return a.timestamp - b.timestamp;
        case 'score-desc': return b.healthScore - a.healthScore;
        case 'score-asc': return a.healthScore - b.healthScore;
        default: return 0;
      }
    });
    return result;
  }, [items, sortOption, minScoreFilter]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getStatusConfig = (score: number) => {
    if (score >= 80) return { badgeClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', accentClass: 'bg-emerald-500' };
    if (score >= 50) return { badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', accentClass: 'bg-amber-500' };
    return { badgeClass: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400', accentClass: 'bg-rose-500' };
  };

  return (
    <div className="animate-fade-in space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">آرشیو تحلیل‌های هوشمند</h2>
        <button onClick={onBack} className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white flex items-center gap-2 transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          بازگشت به داشبورد
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-bold text-gray-700 dark:text-slate-300">مرتب‌سازی:</label>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 text-sm rounded-lg p-2.5 outline-none">
            <option value="date-desc">جدیدترین</option>
            <option value="score-desc">بیشترین امتیاز سلامت</option>
          </select>
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
          <p className="text-gray-500">موردی یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedItems.map((item) => {
            const status = getStatusConfig(item.healthScore);
            const isSelected = selectedForCompare.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => onSelect(item)}
                className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-2 transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-gray-100 dark:border-slate-700'}`}
              >
                <div className={`absolute top-0 right-0 bottom-0 w-1 ${status.accentClass}`} />
                <div className="flex justify-between items-start mb-3">
                  <div onClick={(e) => toggleSelect(e, item.id)} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isSelected && <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <button onClick={(e) => handleDelete(e, item.id)} className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors z-10"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{item.cultureType}</h3>
                    <p className="text-xs text-gray-400 font-bold">{formatDate(item.timestamp)}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">{item.summary}</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t dark:border-slate-700">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${status.badgeClass}`}>امتیاز سلامت: {item.healthScore}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar for Comparison */}
      {selectedForCompare.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-8 py-5 rounded-[2.5rem] shadow-2xl border border-brand-200 dark:border-slate-700 animate-slide-up flex items-center gap-8 z-50 backdrop-blur-md bg-opacity-90">
            <p className="text-sm font-black text-gray-800 dark:text-white">{selectedForCompare.length} مورد برای مقایسه انتخاب شده است</p>
            <div className="flex gap-3">
                <button onClick={() => setSelectedForCompare([])} className="px-6 py-2 rounded-xl text-gray-500 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">لغو انتخاب</button>
                <button onClick={() => onCompare(items.filter(i => selectedForCompare.includes(i.id)))} className="px-10 py-2 bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95">شروع مقایسه روندها</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
