import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackSource, FeedbackSourceWithAnalysis } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function useFeedbackSources() {
  const [feedbackSources, setFeedbackSources] = useState<FeedbackSourceWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFeedbackSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('feedback_sources')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sourcesWithAnalysis = data?.map(source => ({
        ...source,
        status: source.status as 'active' | 'inactive' | 'archived',
        analysis_count: 0 // analysis_results 테이블이 삭제되어 항상 0
      })) || [];

      setFeedbackSources(sourcesWithAnalysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feedback sources';
      setError(errorMessage);
      toast({
        title: "오류 발생",
        description: "피드백 소스를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFeedbackSource = async (source: Omit<FeedbackSource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('feedback_sources')
        .insert([source])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "성공",
        description: "새 피드백 소스가 추가되었습니다.",
      });

      await fetchFeedbackSources();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create feedback source';
      toast({
        title: "오류 발생",
        description: "피드백 소스 추가에 실패했습니다.",
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchFeedbackSources();
  }, []);

  return {
    feedbackSources,
    loading,
    error,
    refetch: fetchFeedbackSources,
    createFeedbackSource
  };
}