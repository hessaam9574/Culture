
import { RawSubmission, QuestionnaireData } from '../types';

const SUBMISSION_KEY = 'culture_analysis_submissions';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const saveSubmission = (data: QuestionnaireData, source: 'web' | 'file' = 'web', fileName?: string): RawSubmission => {
  const submissions = getSubmissions();
  const newItem: RawSubmission = {
    ...data,
    id: generateId(),
    timestamp: Date.now(),
    source,
    fileName
  };
  
  const updated = [newItem, ...submissions];
  try {
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save submission', e);
  }
  return newItem;
};

export const getSubmissions = (): RawSubmission[] => {
  try {
    const stored = localStorage.getItem(SUBMISSION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const deleteSubmissions = (ids: string[]) => {
  const submissions = getSubmissions();
  const updated = submissions.filter(item => !ids.includes(item.id));
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(updated));
  return updated;
};

export const clearAllSubmissions = () => {
  localStorage.removeItem(SUBMISSION_KEY);
};
