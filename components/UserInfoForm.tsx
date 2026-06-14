
import React, { useState, useEffect } from 'react';

interface Props {
  onSubmit: (name: string, jobTitle: string) => void;
}

const LOCAL_STORAGE_USER_INFO_KEY = 'culturai_user_info_draft';

const UserInfoForm: React.FC<Props> = ({ onSubmit }) => {
  const [userName, setUserName] = useState('');
  const [userJobTitle, setUserJobTitle] = useState('');
  const [errors, setErrors] = useState<{ name?: string; jobTitle?: string }>({});

  useEffect(() => {
    // Load draft user info from localStorage
    try {
      const savedInfo = localStorage.getItem(LOCAL_STORAGE_USER_INFO_KEY);
      if (savedInfo) {
        const parsed = JSON.parse(savedInfo);
        setUserName(parsed.userName || '');
        setUserJobTitle(parsed.userJobTitle || '');
      }
    } catch (e) {
      console.error("Failed to load user info draft from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_USER_INFO_KEY);
    }
  }, []);

  useEffect(() => {
    // Save user info to localStorage on change
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_INFO_KEY, JSON.stringify({ userName, userJobTitle }));
    } catch (e) {
      console.error("Failed to save user info draft to localStorage", e);
    }
  }, [userName, userJobTitle]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; jobTitle?: string } = {};
    if (!userName.trim()) {
      newErrors.name = 'وارد کردن نام الزامی است.';
    }
    if (!userJobTitle.trim()) {
      newErrors.jobTitle = 'وارد کردن عنوان شغلی الزامی است.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      onSubmit(userName.trim(), userJobTitle.trim());
      localStorage.removeItem(LOCAL_STORAGE_USER_INFO_KEY); // Clear after submission
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700 text-center max-w-xl w-full">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">اطلاعات شما</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">لطفاً برای ادامه، نام و عنوان شغلی خود را وارد کنید.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="نام و نام خانوادگی"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={`w-full p-4 rounded-xl border-2 ${errors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:border-brand-500'} bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none transition-all shadow-sm`}
            />
            {errors.name && <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-bold">{errors.name}</p>}
          </div>
          
          <div>
            <input
              type="text"
              placeholder="عنوان شغلی (مثال: کارشناس منابع انسانی)"
              value={userJobTitle}
              onChange={(e) => {
                setUserJobTitle(e.target.value);
                setErrors(prev => ({ ...prev, jobTitle: undefined }));
              }}
              className={`w-full p-4 rounded-xl border-2 ${errors.jobTitle ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:border-brand-500'} bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none transition-all shadow-sm`}
            />
            {errors.jobTitle && <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-bold">{errors.jobTitle}</p>}
          </div>
          
          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-l from-brand-700 to-brand-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            ادامه به پرسشنامه
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserInfoForm;
