
import React from 'react';
import { HistoryItem } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface Props {
  items: HistoryItem[];
  onBack: () => void;
}

const COLORS = ['#0ea5e9', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'];

const ComparisonView: React.FC<Props> = ({ items, onBack }) => {
  const formatDate = (ts: number) => new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' }).format(new Date(ts));

  return (
    <div className="animate-fade-in space-y-12 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white">مقایسه تحلیلی روندها</h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium">مشاهده تغییرات شاخص‌های فرهنگی در طول زمان</p>
        </div>
        <button onClick={onBack} className="px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 font-black shadow-sm hover:-translate-x-1 transition-all">بازگشت به تاریخچه</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Score Progress */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl">
            <h3 className="text-xl font-black mb-10">روند امتیاز سلامت فرهنگ</h3>
            <div className="flex items-end justify-around h-[300px] gap-4">
                {items.map((item, i) => (
                    <div key={item.id} className="flex flex-col items-center flex-1 gap-4 group">
                        <div className="relative w-full flex flex-col items-center">
                            <span className="mb-2 font-black text-brand-600 text-sm">{item.healthScore}٪</span>
                            <div 
                                className="w-full max-w-[50px] rounded-2xl transition-all duration-1000 shadow-lg"
                                style={{ height: `${item.healthScore * 2.5}px`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-800 dark:text-white truncate max-w-[80px]">{item.cultureType}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1">{formatDate(item.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Radar Comparison Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
            <h3 className="text-xl font-black mb-10">تطبیق ابعاد فرهنگی</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={items[0].chartData.map((d, idx) => ({
                        subject: d.subject,
                        ...items.reduce((acc, item, i) => ({ ...acc, [`val${i}`]: item.chartData[idx].A }), {})
                    }))}>
                        <PolarGrid stroke="#cbd5e1" strokeOpacity={0.2} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900, fontFamily: 'Vazirmatn' }} />
                        {items.map((item, i) => (
                            <Radar 
                                key={item.id}
                                name={item.cultureType}
                                dataKey={`val${i}`}
                                stroke={COLORS[i % COLORS.length]}
                                fill={COLORS[i % COLORS.length]}
                                fillOpacity={0.1}
                                strokeWidth={4}
                            />
                        ))}
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
                 {items.map((item, i) => (
                     <div key={item.id} className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                         <span className="text-[10px] font-black text-gray-500">{item.cultureType}</span>
                     </div>
                 ))}
            </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl">
          <h3 className="text-2xl font-black mb-12">تحلیل تطبیقی گزاره‌های کلیدی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item, i) => (
                  <div key={item.id} className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <h4 className="text-xl font-black" style={{ color: COLORS[i % COLORS.length] }}>{item.cultureType}</h4>
                      <p className="text-xs font-bold opacity-50">تاریخ: {formatDate(item.timestamp)}</p>
                      <p className="text-slate-300 leading-relaxed text-sm text-justify line-clamp-4">{item.summary}</p>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-[10px] font-black opacity-60">امتیاز سلامت: {item.healthScore}٪</span>
                          <span className="text-[10px] font-black opacity-60">پاسخ‌ها: {item.submissionCount}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default ComparisonView;
