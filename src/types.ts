export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  province?: string; // Support province/location interchangeably
  type: string;
  sector: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  contactEmail: string;
  createdAt: string;
  plan?: string;
  status?: "live" | "pending";
  featured?: boolean;
  featuredUntil?: string | null;
  pinned?: boolean;
}

export interface ResumeAnalysis {
  ratingScore: number;
  matchAssessment: string;
  strengths: string[];
  gaps: string[];
  zambianCompliance: string;
  recommendations: string[];
  tailoredBulletPoints: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  purpose: string;
  keyPointsToInclude: string[];
  sampleAnswer: string;
  userAnswer?: string;
  evaluation?: InterviewEvaluation;
}

export interface InterviewEvaluation {
  rating: "Needs Improvement" | "Good" | "Excellent";
  feedback: string;
  gapsIdentified: string[];
  suggestedPhrasing: string;
  interviewerTips: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "model";
  message: string;
  timestamp: Date;
}
