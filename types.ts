export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: string;
  endTime?: string;
}

export interface SentimentPoint {
  timePoint: string;
  score: number; // 0-100
  context: string;
}

export interface CoachingData {
  strengths: string[];
  improvements: string[];
}

// NEW: Objection categorized by type
export interface Objection {
  type: 'price' | 'timing' | 'authority' | 'need' | 'competitor' | 'other';
  quote: string; // Exact quote from prospect
  timestamp: string;
  rebuttalQuality: 'strong' | 'weak' | 'missed'; // How well did salesperson handle it?
  suggestedRebuttal?: string; // AI-suggested better response
}

// NEW: Sales-specific metrics
export interface SalesMetrics {
  talkRatio: number; // 0-100, percentage of time salesperson talked
  questionCount: number; // Number of questions asked by salesperson
  fillerWordCount: number; // "um", "uh", "like" frequency
  longestMonologue: number; // Seconds of longest uninterrupted speaking
  buyingSignals: string[]; // Positive signals from prospect
  riskSignals: string[]; // Warning signs in conversation
}

// NEW: Risk assessment
export interface RiskAssessment {
  score: number; // 1-10, where 10 = very likely to close
  level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[]; // Why this score was given
  dealBreakers: string[]; // Specific issues that could kill the deal
}

// NEW: Actionable next steps
export interface NextSteps {
  primary: string; // Single most important action
  timeline: string; // "Within 24 hours", "This week", etc.
  secondary: string[]; // Additional follow-ups
  followUpEmail: string; // AI-drafted follow-up email
}

// NEW: Call type classification
export type CallType = 'discovery' | 'demo' | 'negotiation' | 'closing' | 'renewal' | 'other';

export interface AnalysisResult {
  // Core (existing)
  transcript: TranscriptSegment[];
  sentiment: SentimentPoint[];
  coaching: CoachingData;
  summary: string;
  topics: string[];
  
  // NEW: Sales Intelligence
  callType: CallType;
  riskAssessment: RiskAssessment;
  objections: Objection[];
  salesMetrics: SalesMetrics;
  nextSteps: NextSteps;
  
  // NEW: One-liner verdict
  verdict: string; // "Strong discovery call — but missed budget qualification"
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}