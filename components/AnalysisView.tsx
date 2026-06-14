
import React, { useEffect, useState } from 'react';
import { AnalysisResult, Recommendation } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const CHART_THEMES = [
  { id: 'police', color: '#10b981' }, // Emerald Green for Police vibe
  { id: 'navy', color: '#0369a1' },
  { id: 'security', color: '#6366f1' },
  { id: 'alert', color: '#f43f5e' },
];

const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  // Handle double asterisks for bolding and detect paragraph breaks
  const paragraphs = text.split('\n\n');
  
  return (
    <div className="space-y-6">
      {paragraphs.map((p, pIdx) => (
        <p key={pIdx} className="leading-[2.2] text-justify">
          {p.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index} className="font-extrabold text-slate-900 dark:text-white border-b-2 border-emerald-500/20">{part.slice(2, -2)}</strong>;
            }
            return <span key={index}>{part}</span>;
          })}
        </p>
      ))}
    </div>
  );
};

const AccordionLayer = ({ title, subtitle, content, color, icon, isOpen, onToggle }: { 
  title: string, 
  subtitle: string,
  content: string, 
  color: string, 
  icon: React.ReactNode,
  isOpen: boolean,
  onToggle: () => void 
}) => {
  return (
    <div className={`overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 ${isOpen ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-2xl' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'}`}>
      <button 
        onClick={onToggle}
        className="w-full p-8 flex items-center justify-between text-right outline-none group"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rotate-6' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
            {icon}
          </div>
          <div>
            <h5 className={`text-xl font-black transition-colors ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h5>
            <p className={`text-xs font-bold mt-1 transition-colors ${isOpen ? 'text-emerald-500/70' : 'text-slate-400'}`}>{subtitle}</p>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>
      
      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-10 pb-12 pt-4">
          <div className="w-full h-px bg-gradient-to-l from-transparent via-emerald-200 dark:via-emerald-700 to-transparent mb-10"></div>
          <div className="text-slate-600 dark:text-slate-300 text-lg font-medium px-4">
            <FormattedText text={content} />
          </div>
          <div className="mt-10 flex justify-end">
            <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">تحلیل تخصصی لایه {title}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisView: React.FC<Props> = ({ result, onReset }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [openLayer, setOpenLayer] = useState<number | null>(0); 

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    const element = document.getElementById('printable-area');
    if (!element) return;
    const isDarkNow = document.documentElement.classList.contains('dark');
    if (isDarkNow) document.documentElement.classList.remove('dark');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Police-Report-${result.cultureType}-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
        if (isDarkNow) document.documentElement.classList.add('dark');
        setIsDownloading(false);
    });
  };

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div id="printable-area" className="space-y-12 p-10 bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
        <style>{`
            #printable-area { font-family: 'Vazirmatn', sans-serif !important; direction: rtl !important; text-align: right !important; }
            .recharts-responsive-container { direction: ltr !important; }
            .recharts-polar-angle-axis-tick-value { font-family: 'Vazirmatn', sans-serif !important; }
        `}</style>
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b-4 border-emerald-500/10 dark:border-slate-700 pb-10">
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">گزارش راهبردی فرهنگ انتظامی</h2>
                  <p className="text-sm text-slate-400 font-bold mt-1 tracking-tighter">تحلیل‌گر هوشمند سازمانی بر اساس مدل ادگار شاین</p>
                </div>
             </div>
             <div className="text-left">
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-3xl tracking-tighter">CULTUR<span className="text-slate-900 dark:text-white">AI</span></span>
                <p className="text-[10px] font-black text-slate-400 mt-1">SECURITY ANALYTICS ENGINE</p>
             </div>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 h-[480px] flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-8 right-8 z-10 text-right">
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-1">الگوی حاکم (ARCHETYPE)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{result.cultureType}</h3>
                </div>
                
                <div className="w-full h-full flex items-center justify-center pt-10">
                  {result.avatarUrl ? (
                      <div className="w-72 h-72 rounded-[3.5rem] overflow-hidden border-[10px] border-white dark:border-slate-800 shadow-2xl transform group-hover:scale-105 transition-transform duration-700">
                          <img 
                            src={result.avatarUrl} 
                            alt="Police Culture Archetype" 
                            className="w-full h-full object-cover" 
                            crossOrigin="anonymous" 
                          />
                      </div>
                  ) : (
                    <div className="w-56 h-56 rounded-3xl border-4 border-dashed border-emerald-200 dark:border-emerald-900/30 animate-pulse flex items-center justify-center">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">تصویرسازی امنیتی...</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-500">GENERATED BY IMAGEN 4.0</span>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-10 bg-slate-900 dark:bg-slate-950 rounded-[3.5rem] h-[480px] border border-slate-800 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent"></div>
                <p className="text-emerald-400 font-black uppercase tracking-widest mb-4 z-10">شاخص سلامت انتظامی (POLICE HEALTH)</p>
                <div className="flex items-baseline gap-3 mb-6 z-10">
                    <span className="text-[11rem] font-black leading-none text-emerald-500 tabular-nums drop-shadow-2xl">{result.healthScore}</span>
                    <span className="text-4xl font-black text-slate-600">٪</span>
                </div>
                <div className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 z-10 border border-emerald-400/20">
                  {result.healthScore >= 75 ? 'وضعیت مطلوب عملیاتی' : result.healthScore >= 50 ? 'نیاز به اصلاحات فرهنگی' : 'وضعیت بحران انضباطی'}
                </div>
            </div>
        </div>

        {/* Radar Analysis */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-10 text-center flex items-center justify-center gap-4">
              <span className="w-10 h-1 bg-emerald-500 rounded-full"></span>
              پروفایل ۵ بعدی فرهنگ انتظامی
              <span className="w-10 h-1 bg-emerald-500 rounded-full"></span>
            </h3>
            
            <div className="w-full h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.chartData}>
                    <PolarGrid stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth={1} />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ 
                          fill: isDarkMode ? '#94a3b8' : '#475569', 
                          fontSize: 14, 
                          fontWeight: 900,
                          dy: 5
                        }} 
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar 
                        name="نتایج تحلیل"
                        dataKey="A" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        fill="#10b981" 
                        fillOpacity={0.25} 
                        isAnimationActive={true} 
                        dot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '20px', 
                        border: 'none', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        fontFamily: 'Vazirmatn',
                        direction: 'rtl',
                        backgroundColor: '#0f172a',
                        color: '#fff'
                      }}
                    />
                </RadarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 font-bold mt-6 italic">تحلیل بر اساس توازن وزنی بین مصنوعات انتظامی، ارزش‌های ابرازی و مفروضات بنیادین مأموریتی.</p>
        </div>

        {/* Deep Interpretation Accordion */}
        <div className="space-y-8">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-3 h-10 bg-emerald-600 rounded-full"></div>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white">کالبدشکافی عمیق لایه‌های شاین (Iranian Police Model)</h4>
            </div>
            
            <div className="space-y-5">
                <AccordionLayer 
                  title="مصنوعات و کالبد انتظامی (Artifacts)" 
                  subtitle="تحلیل نمادها، یونیفرم، معماری و رفتارهای مشهود"
                  content={result.artifactsAnalysis} 
                  color="emerald" 
                  isOpen={openLayer === 0}
                  onToggle={() => setOpenLayer(openLayer === 0 ? null : 0)}
                  icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" /></svg>}
                />
                
                <AccordionLayer 
                  title="ارزش‌های ابرازی و سازمانی (Values)" 
                  subtitle="تحلیل سوگندنامه، شعارهای رسمی و فلسفه مأموریتی"
                  content={result.valuesAnalysis} 
                  color="emerald" 
                  isOpen={openLayer === 1}
                  onToggle={() => setOpenLayer(openLayer === 1 ? null : 1)}
                  icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                />
                
                <AccordionLayer 
                  title="مفروضات بنیادین و نانوشته (Assumptions)" 
                  subtitle="تحلیل لایه‌های پنهان روان‌شناختی و پیوندهای عمیق یگانی"
                  content={result.assumptionsAnalysis} 
                  color="emerald" 
                  isOpen={openLayer === 2}
                  onToggle={() => setOpenLayer(openLayer === 2 ? null : 2)}
                  icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                />
            </div>
        </div>

        {/* Tactical Recommendations */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-[3.5rem] p-14 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-[120px]"></div>
            <div className="flex items-center justify-between mb-12 relative z-10">
              <div>
                <h3 className="text-3xl font-black">نقشه راه بهبود و اقدامات تاکتیکی</h3>
                <p className="text-slate-500 font-bold mt-2">توصیه‌های هوشمند برای ارتقای انضباط معنوی و اقتدار سازمانی</p>
              </div>
              <div className="hidden sm:block bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-2xl text-xs font-black text-emerald-400 uppercase tracking-widest">INTERNAL SECURITY ONLY</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {result.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex flex-col gap-5 group hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                        <div className="flex justify-between items-center">
                            <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">{idx + 1}</span>
                            <span className={`text-[10px] font-black px-5 py-2 rounded-full ${rec.priority === 'high' ? 'bg-rose-500/80' : 'bg-emerald-500/80'} text-white shadow-sm`}>
                                {rec.priority === 'high' ? 'اولویت: آنی' : 'اولویت: میان‌مدت'}
                            </span>
                        </div>
                        <p className="text-slate-100 text-lg leading-relaxed font-bold">{rec.text}</p>
                        <div className="flex items-center gap-3 mt-auto">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em]">لایه‌ی هدف: {rec.category}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 print:hidden">
        <button onClick={handleDownloadPdf} disabled={isDownloading} className="w-full sm:w-auto px-12 py-5 rounded-2xl font-black bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all flex items-center justify-center gap-4 text-lg">
          {isDownloading ? (
            <>
              <div className="w-6 h-6 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              در حال صدور گواهی تحلیلی...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              دانلود گزارش راهبردی (PDF)
            </>
          )}
        </button>
        <button onClick={onReset} className="w-full sm:w-auto bg-emerald-600 text-white px-14 py-5 rounded-2xl font-black shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95 text-lg border-b-4 border-emerald-800">
          بازگشت به داشبورد ارزیاب
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;
