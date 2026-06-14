
import React, { useState, useEffect } from 'react';
import { QuestionnaireData } from '../types';
import { ASSUMPTION_OPTIONS, VALUE_OPTIONS, ARTIFACT_OPTIONS, POSITIVE_CONCEPTS, CHALLENGE_CONCEPTS } from '../constants';

interface Props {
  onSubmit: (data: QuestionnaireData) => void;
  onFileUpload: (file: File) => Promise<void>;
  onBack: () => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-block mr-2 align-middle">
    <div className="cursor-help w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-emerald-500 hover:text-white transition-all">
      i
    </div>
    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-navy-900 text-white text-[11px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl pointer-events-none border border-white/10">
      {text}
      <div className="absolute top-full right-4 w-2 h-2 bg-navy-900 rotate-45 -mt-1"></div>
    </div>
  </div>
);

const LOCAL_STORAGE_KEY = 'culturai_questionnaire_draft';

const Questionnaire: React.FC<Props> = ({ onSubmit, onFileUpload, onBack }) => {
  const [step, setStep] = useState(1);
  const [otherPositiveInput, setOtherPositiveInput] = useState('');
  const [otherChallengeInput, setOtherChallengeInput] = useState('');
  const [showOtherPositiveField, setShowOtherPositiveField] = useState(false);
  const [showOtherChallengeField, setShowOtherChallengeField] = useState(false);
  
  const [data, setData] = useState<QuestionnaireData>({
    assumptionsSelection: [],
    assumptionsText: '',
    valuesSelection: [],
    valuesText: '',
    artifactsSelection: [],
    artifactsText: '',
    positiveTraits: [],
    challenges: [],
  });

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) setData(JSON.parse(savedDraft));
    } catch (e) { localStorage.removeItem(LOCAL_STORAGE_KEY); }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const toggleSelection = (field: keyof QuestionnaireData, value: string, max?: number) => {
    const current = (data[field] as string[]) || [];
    if (current.includes(value)) {
      setData(prev => ({ ...prev, [field]: current.filter(i => i !== value) }));
    } else {
      if (max && current.length >= max) return;
      setData(prev => ({ ...prev, [field]: [...current, value] }));
    }
  };

  const handleAddOther = (field: keyof QuestionnaireData, value: string, max?: number) => {
    if (!value.trim()) return;
    const current = (data[field] as string[]) || [];
    if (max && current.length >= max) return;
    if (!current.includes(value.trim())) {
      setData(prev => ({ ...prev, [field]: [...current, value.trim()] }));
    }
    if (field === 'positiveTraits') {
      setOtherPositiveInput('');
      setShowOtherPositiveField(false);
    } else {
      setOtherChallengeInput('');
      setShowOtherChallengeField(false);
    }
  };

  const handleTextChange = (field: keyof QuestionnaireData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      onSubmit(data);
    }
  };

  const handleBackStep = () => step > 1 ? setStep(step - 1) : onBack();

  const getStepTheme = (s: number) => {
    switch (s) {
      case 1: return { accent: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/20', check: 'bg-emerald-500', label: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-900/30' };
      case 2: return { accent: 'rose', border: 'border-rose-500', bg: 'bg-rose-50/50 dark:bg-rose-900/20', check: 'bg-rose-500', label: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-900/30' };
      case 3: return { accent: 'violet', border: 'border-violet-500', bg: 'bg-violet-50/50 dark:bg-violet-900/20', check: 'bg-violet-500', label: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-50 dark:bg-violet-900/30' };
      default: return { accent: 'brand', border: 'border-brand-500', bg: 'bg-brand-50/50 dark:bg-brand-900/20', check: 'bg-brand-500', label: 'text-brand-600 dark:text-brand-400', badge: 'bg-brand-50 dark:bg-brand-900/30' };
    }
  };

  const currentTheme = getStepTheme(step);

  const renderOptions = (options: string[], selectionField: keyof QuestionnaireData, max?: number) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 text-right">
      {options.map((opt, idx) => {
        const isSelected = ((data[selectionField] as string[]) || []).includes(opt);
        return (
          <div 
            key={idx} 
            onClick={() => toggleSelection(selectionField, opt, max)}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${isSelected ? `${currentTheme.border} ${currentTheme.bg} shadow-md` : `border-gray-100 dark:border-slate-700 hover:border-emerald-200 bg-white dark:bg-slate-800`}`}
          >
            <span className="text-sm font-bold text-gray-700 dark:text-slate-200 leading-6">{opt}</span>
            <div className={`min-w-[24px] h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? currentTheme.check : 'border-gray-200 dark:border-slate-600'}`}>
              {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTextArea = (field: keyof QuestionnaireData) => (
    <div className="mt-8 space-y-4">
      <label className="block text-sm font-black text-slate-500 dark:text-slate-400">در صورت تمایل، لطفاً مثال یا تجربه شخصی خود را در این زمینه توضیح دهید.</label>
      <textarea
        value={data[field] as string}
        onChange={(e) => handleTextChange(field, e.target.value)}
        placeholder="توضیحات خود را اینجا وارد کنید..."
        className="w-full h-32 p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-emerald-500 transition-all text-sm leading-relaxed"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-right">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="h-2 bg-gray-100 dark:bg-slate-700 flex">
          <div className="h-full transition-all duration-700 ease-out" style={{ width: `${(step / 4) * 100}%`, backgroundColor: step === 1 ? '#10b981' : step === 2 ? '#f43f5e' : step === 3 ? '#8b5cf6' : '#0ea5e9' }}></div>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-10 text-center space-y-2">
            <span className={`text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest ${currentTheme.label} ${currentTheme.badge}`}>مرحله {step} از ۴</span>
          </div>

          {step === 1 && (
            <div className="animate-fade-in space-y-8">
              <div className="bg-emerald-50/30 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-emerald-800 dark:text-emerald-400 text-lg">(باورهای نانوشته، بدیهی و پذیرفته‌شده میان کارکنان پلیس)</h4>
                  <Tooltip text="این لایه شامل مفروضاتی است که به قدری بدیهی انگاشته می‌شوند که پرسنل آگاهانه به آن‌ها فکر نمی‌کنند اما رفتارشان را هدایت می‌کند." />
                </div>
                <p className="text-gray-600 dark:text-slate-300 leading-8 text-justify text-sm font-medium">
                  که بیانگر باور های نانوشته و پذیرفته شده ایست که توسط کلیه نیروهای سازمان رعایت می شوند. این باور ها توسط لایه مدیریتی ابلاغ نمیشوند و هیچ نامه رسمی مبنی بر لزوم رعایت آن ارسال نشده است ، اما تمامی نیرو ها می دانند که پای بندی به این مفاهیم و رعایت آن ها ضروری است.
                </p>
                <h4 className="font-black text-gray-800 dark:text-white mt-8 text-xl border-t border-emerald-100 pt-6">در انجام وظایف پلیسی، کدام موارد را بدون وجود دستورالعمل یا ابلاغ رسمی، همواره رعایت می‌کنید؟</h4>
              </div>
              {renderOptions(ASSUMPTION_OPTIONS, 'assumptionsSelection')}
              {renderTextArea('assumptionsText')}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-8">
              <div className="bg-rose-50/30 dark:bg-rose-900/10 p-6 rounded-3xl border border-rose-100/50 dark:border-rose-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-rose-800 dark:text-rose-400 text-lg">(ارزش‌های رسمی، اعلام‌شده و خطوط قرمز حرفه پلیسی)</h4>
                  <Tooltip text="ارزش‌هایی که سازمان آگاهانه آن‌ها را ترویج می‌کند و از پرسنل می‌خواهد به آن‌ها پایبند باشند (مثل سوگندنامه یا منشور اخلاقی)." />
                </div>
                <p className="text-gray-600 dark:text-slate-300 leading-8 text-justify text-sm font-medium">
                  ارزش ها و معیار هایی که سازمان بیان میکند و اعضا به آن پای بندند . برعکس مورد اول، این مفاهیم نا نوشته نیستند. سازمان نه نتها آن ها را اعلام میکند، بلکه رعایت آن توسط پرسنل سازمان را ضروری میداند. از این مفاهیم میتوان به عنوان خطوط قرمز سازمان یاد کرد. به گونه ای که ادامه همکاری بدون پای بندی به آن ها میسر نباشد.
                </p>
                <h4 className="font-black text-gray-800 dark:text-white mt-8 text-xl border-t border-rose-100 pt-6">کدام موارد را به‌عنوان خطوط قرمز حرفه پلیسی می‌شناسید که عدم رعایت آن‌ها پیامدهای جدی در پی دارد؟</h4>
              </div>
              {renderOptions(VALUE_OPTIONS, 'valuesSelection')}
              {renderTextArea('valuesText')}
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-8">
              <div className="bg-violet-50/30 dark:bg-violet-900/10 p-6 rounded-3xl border border-violet-100/50 dark:border-violet-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-violet-800 dark:text-violet-400 text-lg">(مصادیق عینی، قابل مشاهده و روزمره فرهنگ سازمانی)</h4>
                  <Tooltip text="سطحی‌ترین لایه فرهنگ شامل آنچه دیده و شنیده می‌شود (لباس، نحوه صحبت، چیدمان محیط، مراسمات)." />
                </div>
                <p className="text-gray-600 dark:text-slate-300 leading-8 text-justify text-sm font-medium">
                  نمادها و رفتارهایی که در سطح آشکار سازمان قرار دارند و هر ناظر بیرونی می‌تواند آن‌ها را درک کند.
                </p>
                <h4 className="font-black text-gray-800 dark:text-white mt-8 text-xl border-t border-violet-100 pt-6">اگر یک فرد بیرون از سازمان پلیس شما را در حین انجام مأموریت مشاهده کند، رفتار و عملکرد شما را چگونه توصیف خواهد کرد؟</h4>
              </div>
              {renderOptions(ARTIFACT_OPTIONS, 'artifactsSelection')}
              {renderTextArea('artifactsText')}
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in space-y-12">
              <div>
                <label className="block text-lg font-black text-gray-800 dark:text-slate-100 mb-6 flex items-center">
                  ویژگی‌های مثبت مشاهده شده (حداکثر ۳ مورد)
                  <Tooltip text="نقاط قوت برجسته‌ای که در یگان خود لمس می‌کنید." />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {POSITIVE_CONCEPTS.map((item) => {
                    const isSelected = (data.positiveTraits || []).includes(item.label);
                    return (
                      <div key={item.id} onClick={() => toggleSelection('positiveTraits', item.label, 3)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{item.label}</span>
                        {isSelected && <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center animate-scale-in"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3}/></svg></div>}
                      </div>
                    );
                  })}
                  
                  {data.positiveTraits.filter(trait => !POSITIVE_CONCEPTS.some(c => c.label === trait)).map((trait, idx) => (
                    <div key={`custom-pos-${idx}`} onClick={() => toggleSelection('positiveTraits', trait, 3)} className="p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md">
                      <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{trait}</span>
                      <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center animate-scale-in"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3}/></svg></div>
                    </div>
                  ))}

                  <button 
                    onClick={() => setShowOtherPositiveField(!showOtherPositiveField)}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5}/></svg>
                    سایر موارد
                  </button>
                </div>

                {showOtherPositiveField && (
                  <div className="flex gap-2 animate-slide-up mb-8">
                    <input 
                      type="text" 
                      value={otherPositiveInput}
                      onChange={(e) => setOtherPositiveInput(e.target.value)}
                      placeholder="ویژگی مورد نظر خود را تایپ کنید..."
                      className="flex-1 p-3 rounded-xl border-2 border-brand-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                    />
                    <button 
                      onClick={() => handleAddOther('positiveTraits', otherPositiveInput, 3)}
                      className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                    >
                      افزودن
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-lg font-black text-gray-800 dark:text-slate-100 mb-6 flex items-center">
                  چالش‌های مشاهده شده (بدون محدودیت تعداد)
                  <Tooltip text="موانع یا تضادهایی که مانع تحقق اهداف فرهنگی می‌شوند." />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {CHALLENGE_CONCEPTS.map((item) => {
                    const isSelected = (data.challenges || []).includes(item.label);
                    return (
                      <div key={item.id} onClick={() => toggleSelection('challenges', item.label)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{item.label}</span>
                        {isSelected && <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center animate-scale-in"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3}/></svg></div>}
                      </div>
                    );
                  })}

                  {data.challenges.filter(c => !CHALLENGE_CONCEPTS.some(cc => cc.label === c)).map((trait, idx) => (
                    <div key={`custom-chal-${idx}`} onClick={() => toggleSelection('challenges', trait)} className="p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md">
                      <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{trait}</span>
                      <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center animate-scale-in"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3}/></svg></div>
                    </div>
                  ))}

                  <button 
                    onClick={() => setShowOtherChallengeField(!showOtherChallengeField)}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5}/></svg>
                    سایر چالش‌ها
                  </button>
                </div>

                {showOtherChallengeField && (
                  <div className="flex gap-2 animate-slide-up">
                    <input 
                      type="text" 
                      value={otherChallengeInput}
                      onChange={(e) => setOtherChallengeInput(e.target.value)}
                      placeholder="چالش مورد نظر خود را تایپ کنید..."
                      className="flex-1 p-3 rounded-xl border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                    />
                    <button 
                      onClick={() => handleAddOther('challenges', otherChallengeInput)}
                      className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
                    >
                      افزودن
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-16 flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 border-t dark:border-slate-700">
            <button onClick={handleBackStep} className="w-full sm:w-auto px-10 py-4 rounded-2xl border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-black hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">مرحله قبل</button>
            <button 
                onClick={handleNext} 
                className={`w-full sm:w-auto px-16 py-4 rounded-2xl text-white font-black shadow-xl transition-all flex items-center justify-center gap-3 ${step === 4 ? 'bg-brand-600' : 'bg-emerald-600'}`}
            >
              {step === 4 ? "ثبت نهایی اطلاعات" : "مرحله بعد"}
              {step < 4 && <svg className="w-5 h-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
