
import { AnalysisResult, HistoryItem } from '../types';

const STORAGE_KEY = 'culture_analysis_history';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const saveToHistory = (result: AnalysisResult, submissionCount: number = 1): HistoryItem => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...result,
    id: generateId(),
    timestamp: Date.now(),
    submissionCount,
  };
  // Add to beginning of array
  const updatedHistory = [newItem, ...history];
  
  // Optional: Limit history size to e.g., 50 items to prevent localStorage overflow
  if (updatedHistory.length > 50) {
      updatedHistory.pop();
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Failed to save history to localStorage', e);
  }
  
  return newItem;
};

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse history from localStorage', e);
    return [];
  }
};

export const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
  const history = getHistory();
  const index = history.findIndex(item => item.id === id);
  if (index !== -1) {
    history[index] = { ...history[index], ...updates };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch(e) { console.error('Failed to update history', e); }
  }
};

export const deleteFromHistory = (id: string): HistoryItem[] => {
  const history = getHistory();
  const updated = history.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update history in localStorage', e);
  }
  return updated;
};

export const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
};
