export interface FeedbackSource {
  id: string;
  name: string;
  source_url: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  last_analyzed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCandidate {
  id: string;
  title: string;
  description?: string;
  source_feedback_id?: string;
  frequency_score: number;
  impact_score: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PRDDraft {
  id: string;
  task_id?: string;
  title: string;
  background?: string;
  problem?: string;
  solution?: string;
  ux_requirements?: string;
  edge_cases?: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  version: number;
  output_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAsset {
  id: string;
  task_id?: string;
  prd_id?: string;
  type: 'faq' | 'banner' | 'notification' | 'guide' | 'announcement';
  title: string;
  content?: string;
  target_channel?: 'slack' | 'confluence' | 'blog' | 'customer_center' | 'app_popup';
  status: 'draft' | 'review' | 'approved' | 'published';
  output_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  source_feedback_id: string;
  analysis_type: 'sentiment' | 'categorization' | 'summary' | 'task_extraction';
  result_url: string;
  summary?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

// Combined types for UI components
export interface FeedbackSourceWithAnalysis extends FeedbackSource {
  latest_analysis?: AnalysisResult;
  analysis_count?: number;
}

export interface TaskCandidateWithDetails extends TaskCandidate {
  source_feedback?: FeedbackSource;
  feedback_count?: number;
  total_score?: number;
}

export interface ContentAssetWithDetails extends ContentAsset {
  task?: TaskCandidate;
  prd?: PRDDraft;
  word_count?: number;
}