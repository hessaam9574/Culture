
import React, { useState, useEffect } from 'react';
import { RawSubmission } from '../types';
import { getSubmissions, deleteSubmissions } from '../services/submissionService';

interface Props {
  onAnalyze: (selectedIds: string[], focus: string[], sensitivity: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  onHistory: () => void;
}

const SubmissionDetailPanel: React.FC<{ submission: RawSubmission }> = ({ submission }) => (
  <div className="bg-slate-50 dark:bg-navy-900/70 p-10 rounded-b-[2.5rem] border-t border-emerald-500/10 animate-fade-in shadow-inner">
    <div className="space-y-12 text-sm text-right">
      <div className="flex justify-between items-center border-b-2 border-emerald-500/10 pb-6">
        <h4 className="font-black text-2xl text-navy-900 dark:text-emerald-50">جزئیات پرسشنامه پایش فرهنگ</h4>
        <span className="text-xs font-black px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200/50">ID: {submission.id}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-emerald-500/5 shadow-sm">
          <p className="font-black text-slate-400 text-xs uppercase mb-2">نام و مشخصات:</p>
          <p className="text-xl font-black text-navy-900 dark:text-white">{submission.userName || 'ناشناس'}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-emerald-500/5 shadow-sm">
          <p className="font-black text-slate-400 text-xs uppercase mb-2">سمت سازمانی:</p>
          <p className="text-xl font-black text-navy-900 dark:text-white">{submission.userJobTitle || 'ذکر نشده'}</p>
        </div>
      </div>

      <div className="space-y-10">
        <div className="space-y-6">
            <h5 className="font-black text-emerald-700 dark:text-emerald-400 text-lg flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/50"></span>
              مفروضات بنیادین (Assumptions)
            </h5>
            <div className="flex flex-wrap gap-2">
              {submission.assumptionsSelection.length > 0 ? submission.assumptionsSelection.map((s, i) => (
                <span key={i} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-800/50">{s}</span>
              )) : <span className="text-slate-400 italic">بدون انتخاب گزینه</span>}
            </div>
            <div className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-emerald-500/5 italic leading-loose text-justify text-slate-700 dark:text-slate-300 shadow-inner">
              {submission.assumptionsText || 'توضیحات تشریحی ثبت نشده است.'}
            </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC<Props> = ({ onAnalyze, onFileUpload, onHistory }) => {
  const [submissions, setSubmissions] = useState<RawSubmission[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>(['artifacts', 'values', 'assumptions']);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  useEffect(() => { setSubmissions(getSubmissions()); }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === submissions.length ? [] : submissions.map(s => s.id));
  };

  const toggleFocus = (f: string) => {
    setFocus(prev => prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`آیا از حذف ${selectedIds.length} مورد اطمینان دارید؟`)) {
      setSubmissions(deleteSubmissions(selectedIds));
      setSelectedIds([]);
    }
  };

  const sensitivityOptions = [
    {
      id: 'low',
      title: 'تحلیل صیانتی (خوش‌بینانه)',
      desc: 'تمرکز بر تقویت نقاط قوت و انضباط معنوی پرسنل',
      activeBorder: 'border-emerald-500',
      activeText: 'text-emerald-700 dark:text-emerald-400',
      activeShadow: 'shadow-emerald-500/20',
      dotColor: 'bg-emerald-500'
    },
    {
      id: 'medium',
      title: 'تحلیل راهبردی (متعادل)',
      desc: 'ترکیب واقع‌بینانه فرصت‌ها و تهدیدهای فرهنگی یگان',
      activeBorder: 'border-blue-400', 
      activeText: 'text-blue-600 dark:text-blue-400',
      activeShadow: 'shadow-blue-400/20',
      dotColor: 'bg-blue-400'
    },
    {
      id: 'high',
      title: 'تحلیل آسیب‌شناسانه (سخت‌گیرانه)',
      desc: 'موشکافی دقیق تضادهای فرهنگی و چالش‌های سیستمی فراجا',
      activeBorder: 'border-rose-500',
      activeText: 'text-rose-600 dark:text-rose-400',
      activeShadow: 'shadow-rose-500/20',
      dotColor: 'bg-rose-500'
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-20 text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-5xl font-black text-navy-900 dark:text-white">داشبورد ارزیاب</h2>
          <p className="text-slate-500 dark:text-emerald-500/60 font-black mt-2 text-sm uppercase tracking-widest">FARAJA Culture Intelligence Dashboard</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={onHistory} className="flex-1 md:flex-none px-10 py-5 bg-white dark:bg-navy-900 border-2 border-slate-100 dark:border-emerald-500/5 rounded-3xl font-black text-slate-700 dark:text-emerald-400 hover:shadow-xl transition-all">آرشیو گزارشات</button>
          <label className="flex-1 md:flex-none px-10 py-5 bg-emerald-700 text-white rounded-3xl font-black shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition-all cursor-pointer flex items-center justify-center gap-3">
            واکاوی فایل جدید
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>
            <input type="file" className="hidden" accept=".docx,.xlsx" onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-[3.5rem] shadow-2xl border border-emerald-500/5 flex flex-col h-[750px] overflow-hidden">
          <div className="p-8 border-b dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={submissions.length > 0 && selectedIds.length === submissions.length} 
                  onChange={toggleSelectAll} 
                  className="w-6 h-6 rounded-lg text-emerald-700 border-emerald-200 focus:ring-emerald-500 cursor-pointer" 
                />
                <span className="font-black text-navy-900 dark:text-emerald-100 text-lg">پرسشنامه‌های دریافتی ({submissions.length})</span>
             </div>
             {selectedIds.length > 0 && (
               <button onClick={handleDelete} className="text-rose-500 font-black text-sm px-4 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/50 transition-all hover:bg-rose-100">
                 حذف ({selectedIds.length})
               </button>
             )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-8 space-y-5">
             {submissions.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2}/></svg>
                  <p className="font-black text-center text-sm">دیتابیس پرسشنامه‌ها خالی است.<br/>از بخش واکاوی یا ثبت توسط پرسنل اقدام کنید.</p>
               </div>
             ) : (
               submissions.map(sub => (
                 <div key={sub.id} className={`rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden ${selectedIds.includes(sub.id) ? 'border-emerald-500 bg-emerald-50/20 shadow-lg' : 'border-slate-50 dark:border-navy-800 hover:border-emerald-500/20'}`}>
                    <div className="p-6 flex items-center gap-6">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(sub.id)} 
                        onChange={() => toggleSelect(sub.id)}
                        className="w-6 h-6 rounded-lg text-emerald-700 border-emerald-200 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedSubmissionId(expandedSubmissionId === sub.id ? null : sub.id)}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg">{sub.source === 'file' ? 'اسکن سند' : 'ثبت مستقیم'}</span>
                          <span className="text-[10px] text-slate-400 font-bold tabular-nums">{new Date(sub.timestamp).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <p className="font-black text-navy-900 dark:text-white truncate text-xl">{sub.userName || 'ناشناس'}</p>
                        <p className="text-xs text-slate-500 mt-1 font-bold">{sub.userJobTitle || 'بدون سمت سازمانی'}</p>
                      </div>
                      <button onClick={() => setExpandedSubmissionId(expandedSubmissionId === sub.id ? null : sub.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${expandedSubmissionId === sub.id ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rotate-180' : 'bg-slate-50 dark:bg-navy-800 text-slate-400'}`}>
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                    {expandedSubmissionId === sub.id && <SubmissionDetailPanel submission={sub} />}
                 </div>
               ))
             )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white dark:bg-navy-900 p-10 rounded-[3.5rem] shadow-2xl border border-emerald-500/5">
              <h3 className="font-black text-2xl mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
                تنظیمات موتور هوشمند
              </h3>
              <div className="space-y-10">
                <div className="space-y-5">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">لایه‌های تمرکز شاین (Scope):</label>
                  <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'artifacts', label: 'مصنوعات' },
                        { id: 'values', label: 'ارزش‌ها' },
                        { id: 'assumptions', label: 'مفروضات' }
                      ].map(f => (
                        <button 
                          key={f.id}
                          onClick={() => toggleFocus(f.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${focus.includes(f.id) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-navy-800 border-slate-100 dark:border-navy-700 text-slate-500'}`}
                        >
                          {f.label}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">رویکرد تحلیل (سطح موشکافی):</label>
                  <div className="flex flex-col gap-4">
                    {sensitivityOptions.map((opt) => {
                      const isActive = sensitivity === opt.id;
                      return (
                        <div key={opt.id} onClick={() => setSensitivity(opt.id as any)}
                          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-1 relative overflow-hidden ${isActive ? `${opt.activeBorder} ${opt.activeShadow} bg-white dark:bg-navy-800 -translate-x-2` : 'border-slate-50 dark:border-navy-800 bg-slate-50/30 dark:bg-navy-950/30 hover:border-emerald-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-black text-base transition-colors ${isActive ? opt.activeText : 'text-slate-700 dark:text-emerald-100/60'}`}>
                              {opt.title}
                            </span>
                            {isActive && <div className={`w-2.5 h-2.5 rounded-full animate-ping ${opt.dotColor}`}></div>}
                          </div>
                          <span className={`text-[11px] font-bold leading-relaxed ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                            {opt.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
           </div>

           <div className="space-y-3">
              <button 
                disabled={selectedIds.length === 0}
                onClick={() => onAnalyze(selectedIds, focus, sensitivity)}
                className="w-full py-8 bg-emerald-700 text-white rounded-[3rem] font-black text-2xl shadow-2xl shadow-emerald-700/40 hover:bg-emerald-800 hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-30 disabled:translate-y-0"
              >
                تولید گزارش راهبردی ({selectedIds.length})
              </button>
              {selectedIds.length === 0 && submissions.length > 0 && (
                <p className="text-center text-xs text-rose-500 font-bold animate-pulse">لطفاً ابتدا پرسشنامه‌های مورد نظر را علامت‌گذاری کنید.</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
