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

export interface AnalysisResult {
  transcript: TranscriptSegment[];
  sentiment: SentimentPoint[];
  coaching: CoachingData;
  summary: string;
  topics: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}