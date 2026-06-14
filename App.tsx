
import React, { useState, useEffect } from 'react';
import { AppStep, QuestionnaireData, AnalysisResult, HistoryItem, UserRole } from './types';
import Questionnaire from './components/Questionnaire';
import AnalysisView from './components/AnalysisView';
import HistoryView from './components/HistoryView';
import AdminDashboard from './components/AdminDashboard';
import AIAssistant from './components/AIAssistant';
import ComparisonView from './components/ComparisonView';
import UserInfoForm from './components/UserInfoForm';
import { analyzeCultureText, generateCultureAvatar, convertTextToQuestionnaireData, aggregateSubmissions } from './services/geminiService';
import { parseFile } from './services/fileParsingService';
import { saveToHistory, updateHistoryItem } from './services/historyService';
import { saveSubmission, getSubmissions } from './services/submissionService';

declare global {
  interface Window {
    html2pdf: any;
  }
}

// کامپوننت لوگوی رسمی فراجا (بر اساس تصویر ارسالی)
const FarajaLogo = ({ className }: { className?: string }) => (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Seal_of_the_Law_Enforcement_Force_of_the_Islamic_Republic_of_Iran.svg/1024px-Seal_of_the_Law_Enforcement_Force_of_the_Islamic_Republic_of_Iran.svg.png" 
    alt="لوگوی فراجا" 
    className={className} 
    style={{ filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.1))' }}
  />
);

const WelcomeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in text-right">
      <div className="bg-white dark:bg-navy-900 p-10 rounded-[3.5rem] shadow-2xl border border-emerald-500/20 max-w-lg w-full text-center space-y-8 animate-scale-in">
        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/10 p-2">
          <FarajaLogo className="w-full h-full object-contain" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-navy-900 dark:text-white">خوش آمدید</h3>
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
            کاربر گرامی پیشاپیش از مشارکت شما در پرسشنامه استخراج فرهنگ سازمانی کمال تشکر را داریم.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const dateParts = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).formatToParts(now);
  const getPart = (type: string) => dateParts.find(p => p.type === type)?.value || '';
  const dateString = `${getPart('weekday')}، ${getPart('day')} ${getPart('month')} ${getPart('year')}`;

  return (
    <div dir="rtl" className="hidden lg:flex items-center gap-4 bg-white/10 dark:bg-navy-900/40 border border-emerald-500/10 dark:border-emerald-500/5 px-5 py-2 rounded-2xl shadow-sm backdrop-blur-md">
      <div className="flex flex-col items-start leading-tight">
        <span className="text-gray-900 dark:text-emerald-50 text-sm font-bold whitespace-nowrap">{dateString}</span>
      </div>
      <div className="flex items-center gap-2 border-r border-gray-200 dark:border-slate-700/50 pr-4">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </div>
        <span className="text-emerald-700 dark:text-emerald-400 font-black text-xl tabular-nums" style={{ direction: 'ltr' }}>{timeString}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<AppStep>(AppStep.INTRO);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [comparisonItems, setComparisonItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserJobTitle, setCurrentUserJobTitle] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(selectedRole === 'USER' ? AppStep.USER_INFO_ENTRY : AppStep.ADMIN_DASHBOARD);
    setError(null);
  };

  const handleUserInfoSubmit = (name: string, jobTitle: string) => {
    setCurrentUserName(name);
    setCurrentUserJobTitle(jobTitle);
    setStep(AppStep.QUESTIONNAIRE);
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleUserSubmit = (data: QuestionnaireData) => {
    try {
      saveSubmission({ ...data, userName: currentUserName, userJobTitle: currentUserJobTitle }, 'web');
      setStep(AppStep.SUBMISSION_SUCCESS);
      window.scrollTo(0, 0);
    } catch (err) {
      setError("خطا در ثبت اطلاعات. لطفا دوباره تلاش کنید.");
    }
  };

  const handleUserFileUpload = async (file: File) => {
    setLoadingMessage('در حال واکاوی اسناد انتظامی...');
    setStep(AppStep.ANALYZING);
    setError(null);
    try {
        const rawText = await parseFile(file);
        const structuredData = await convertTextToQuestionnaireData(rawText);
        saveSubmission({ ...structuredData, userName: currentUserName, userJobTitle: currentUserJobTitle }, 'file', file.name);
        setStep(AppStep.SUBMISSION_SUCCESS);
    } catch (err: any) {
        setError(err.message || 'خطا در پردازش فایل');
        setStep(AppStep.QUESTIONNAIRE);
    }
  };

  const handleAdminFileUpload = async (file: File) => {
    try {
        const rawText = await parseFile(file);
        const structuredData = await convertTextToQuestionnaireData(rawText);
        saveSubmission(structuredData, 'file', file.name); 
        alert("فایل با موفقیت در دیتابیس ارزیاب بارگذاری شد.");
    } catch (err: any) { alert(err.message); }
  };

  const handleAdminAnalyze = async (selectedIds: string[], focus: string[], sensitivity: string) => {
    if (selectedIds.length === 0) {
      setError("لطفاً حداقل یک پرسشنامه را برای تحلیل انتخاب کنید.");
      return;
    }
    setStep(AppStep.ANALYZING);
    setLoadingMessage('در حال اجرای مدل محاسباتی سلامت انتظامی...');
    setError(null);
    try {
      const allSubmissions = getSubmissions();
      const selectedSubmissions = allSubmissions.filter(s => selectedIds.includes(s.id));
      const aggregatedData = aggregateSubmissions(selectedSubmissions);
      await new Promise(r => setTimeout(r, 800));
      const mappedResult = await analyzeCultureText(aggregatedData, focus, sensitivity);
      const savedHistoryItem = saveToHistory(mappedResult, selectedSubmissions.length);
      setResult(mappedResult);
      setStep(AppStep.RESULT);
      generateCultureAvatar(mappedResult.cultureType, mappedResult.sentiment).then(avatarUrl => {
         if (avatarUrl) {
             setResult(prev => prev && prev.cultureType === mappedResult.cultureType ? { ...prev, avatarUrl } : prev);
             updateHistoryItem(savedHistoryItem.id, { avatarUrl });
         }
      });
    } catch (err: any) {
      setError(err.message || 'خطایی در موتور تحلیل رخ داد.');
      setStep(AppStep.ADMIN_DASHBOARD);
    }
  };

  const handleReset = () => {
    setResult(null); setRole(null); setCurrentUserName(''); setCurrentUserJobTitle(''); setStep(AppStep.INTRO); setError(null);
  };

  const startNewSubmission = () => {
    setStep(AppStep.USER_INFO_ENTRY);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-gray-900 dark:text-emerald-50 pb-12 transition-colors duration-300">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      
      <nav className="bg-white dark:bg-navy-900 border-b border-emerald-500/10 dark:border-emerald-500/5 sticky top-0 z-50 shadow-sm backdrop-blur-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={handleReset}>
                <div className="w-14 h-14 bg-white dark:bg-navy-800 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-500/10 transition-transform hover:scale-105 active:scale-95 p-2">
                    <FarajaLogo className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xl font-black text-emerald-900 dark:text-emerald-400 leading-none">فرهنگ سازمانی <span className="text-navy-800 dark:text-white">فراجا</span></span>
                  <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">سامانه پایش راهبردی انتظامی</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <LiveClock />
                <button onClick={toggleDarkMode} className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-transparent dark:border-emerald-500/10">
                    {isDarkMode ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                    )}
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {step === AppStep.INTRO && (
          <div className="text-center py-20 space-y-10 animate-fade-in relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10"></div>
              <div className="mx-auto w-36 h-36 bg-white dark:bg-navy-900 rounded-[2.5rem] shadow-2xl border border-emerald-500/10 flex items-center justify-center mb-8 p-4 overflow-hidden">
                  <FarajaLogo className="w-full h-full object-contain" />
              </div>
              <h1 className="text-6xl font-black text-navy-900 dark:text-white leading-tight">پلتفرم راهبردی تحلیل <span className="text-emerald-700 dark:text-emerald-500">فرهنگ سازمانی فراجا</span></h1>
              <p className="text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">ارزیابی تخصصی لایه‌های آشکار و پنهان فرهنگ انتظامی مبتنی بر هوش مصنوعی و مدل ادگار شاین</p>
              
              <div className="flex flex-wrap justify-center gap-10 mt-16">
                  <button onClick={() => handleRoleSelect('USER')} className="group relative bg-white dark:bg-navy-900 border-2 border-emerald-100 dark:border-emerald-500/10 p-12 rounded-[3.5rem] overflow-hidden hover:border-emerald-500 transition-all shadow-2xl hover:shadow-emerald-500/20 w-80 text-right flex flex-col items-center hover:-translate-y-4 active:scale-95 duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 border border-emerald-100 dark:border-emerald-500/10">
                          <svg className="w-12 h-12 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      </div>
                      <span className="text-3xl font-black text-navy-900 dark:text-white z-10">ورود پرسنل</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center z-10 font-bold px-4 leading-relaxed">مشارکت در طرح پایش فرهنگ سازمانی و تکمیل پرسشنامه</span>
                  </button>

                  <button onClick={() => handleRoleSelect('ADMIN')} className="group relative bg-navy-800 dark:bg-navy-900 border-2 border-navy-700 p-12 rounded-[3.5rem] overflow-hidden hover:border-emerald-500 transition-all shadow-2xl hover:shadow-emerald-500/20 w-80 text-right flex flex-col items-center hover:-translate-y-4 active:scale-95 duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 border border-white/20 p-2">
                          <FarajaLogo className="w-full h-full object-contain" />
                      </div>
                      <span className="text-3xl font-black text-white z-10">ورود ارزیاب</span>
                      <span className="text-sm text-emerald-100/60 mt-4 text-center z-10 font-bold px-4 leading-relaxed">دسترسی به داشبورد ارزیاب، واکاوی داده‌ها و صدور گزارش راهبردی</span>
                  </button>
              </div>
          </div>
        )}

        {step === AppStep.USER_INFO_ENTRY && <UserInfoForm onSubmit={handleUserInfoSubmit} />}
        
        {step === AppStep.QUESTIONNAIRE && (
          <Questionnaire onSubmit={handleUserSubmit} onFileUpload={handleUserFileUpload} onBack={() => setStep(AppStep.USER_INFO_ENTRY)} />
        )}

        {step === AppStep.SUBMISSION_SUCCESS && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-scale-in">
              <div className="bg-white dark:bg-navy-900 p-20 rounded-[4.5rem] shadow-2xl border border-emerald-500/10 text-center max-w-3xl w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 to-emerald-800"></div>
                  <div className="w-40 h-40 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-12 shadow-xl shadow-emerald-500/10 border-4 border-white dark:border-navy-800 p-6">
                      <FarajaLogo className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-5xl font-black text-navy-900 dark:text-white mb-8">اطلاعات با موفقیت ثبت شد</h2>
                  <p className="text-2xl text-slate-500 dark:text-slate-400 mb-16 font-medium leading-relaxed">مشارکت شما در طرح استخراج فرهنگ سازمانی فراجا با موفقیت ذخیره گردید. از همکاری صمیمانه شما سپاسگزاریم.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <button onClick={handleReset} className="py-6 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-white rounded-[2.5rem] font-black text-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700">
                        صفحه اصلی
                      </button>
                      <button onClick={startNewSubmission} className="py-6 bg-brand-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3">
                        ثبت فرم جدید
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5}/></svg>
                      </button>
                      <button onClick={() => { setRole('ADMIN'); setStep(AppStep.ADMIN_DASHBOARD); }} className="py-6 bg-emerald-700 text-white rounded-[2.5rem] font-black text-xl hover:bg-emerald-800 shadow-xl shadow-emerald-800/20 transition-all flex items-center justify-center gap-3 lg:col-span-1">
                        پنل مدیریتی
                        <svg className="w-6 h-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.5 19.5L3 12m0 0l7-7 7 7M3 12h18" strokeWidth={2.5}/></svg>
                      </button>
                  </div>
              </div>
          </div>
        )}

        {step === AppStep.ADMIN_DASHBOARD && <AdminDashboard onAnalyze={handleAdminAnalyze} onFileUpload={handleAdminFileUpload} onHistory={() => setStep(AppStep.HISTORY)} />}
        {step === AppStep.RESULT && result && <AnalysisView result={result} onReset={() => setStep(AppStep.ADMIN_DASHBOARD)} />}
        {step === AppStep.HISTORY && <HistoryView onBack={() => setStep(AppStep.ADMIN_DASHBOARD)} onSelect={(item) => { setResult(item); setStep(AppStep.RESULT); }} onCompare={(items) => { setComparisonItems(items); setStep(AppStep.COMPARE); }} />}
        {step === AppStep.COMPARE && <ComparisonView items={comparisonItems} onBack={() => setStep(AppStep.HISTORY)} />}
      </main>

      <AIAssistant context={result ? JSON.stringify(result) : undefined} />
    </div>
  );
};

export default App;
