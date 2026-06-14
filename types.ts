
export type UserRole = 'USER' | 'ADMIN';

export interface QuestionnaireData {
  userName?: string;
  userJobTitle?: string;
  
  // Level 1: Assumptions
  assumptionsSelection: string[];
  assumptionsText: string;
  
  // Level 2: Values
  valuesSelection: string[];
  valuesText: string;
  
  // Level 3: Artifacts
  artifactsSelection: string[];
  artifactsText: string;

  // Level 4: Summary Traits
  positiveTraits: string[];
  challenges: string[];

  analysisFocus?: string[]; 
  sentimentSensitivity?: 'low' | 'medium' | 'high'; 
}

export interface RawSubmission extends QuestionnaireData {
  id: string;
  timestamp: number;
  source: 'web' | 'file';
  fileName?: string;
}

export interface AnalysisChartData {
  subject: string;
  A: number;
  fullMark: number;
}

export interface Recommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'استراتژیک' | 'عملیاتی' | 'فرهنگی';
  details?: string;
}

export interface AnalysisResult {
  cultureType: string;
  summary: string;
  culturalStatement: string;
  healthScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  artifactsAnalysis: string;
  valuesAnalysis: string;
  assumptionsAnalysis: string;
  chartData: AnalysisChartData[];
  recommendations: Recommendation[];
  avatarUrl?: string;
}

export interface HistoryItem extends AnalysisResult {
  id: string;
  timestamp: number;
  submissionCount: number;
}

export enum AppStep {
  INTRO = 'INTRO',
  USER_INFO_ENTRY = 'USER_INFO_ENTRY',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  SUBMISSION_SUCCESS = 'SUBMISSION_SUCCESS',
  COMPARE = 'COMPARE',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  groundingLinks?: { uri: string; title: string }[];
}
