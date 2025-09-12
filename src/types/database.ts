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
  development_cost?: number;  // 1-3 MM
  effect_score?: number;      // 1: 좋음, 2: 보통, 3: 낮음
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

// AnalysisResult interface removed as table was dropped

// Combined types for UI components
export interface FeedbackSourceWithAnalysis extends FeedbackSource {
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

export interface ServiceLaunch {
  id: string;
  prd_id: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  generated_content?: any;
  status: 'preparing' | 'ready' | 'launched';
  created_by: string;
  created_at: string;
  updated_at: string;
}