import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskCandidate, TaskCandidateWithDetails } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function useTaskCandidates() {
  const [taskCandidates, setTaskCandidates] = useState<TaskCandidateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTaskCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('task_candidates')
        .select(`
          *,
          feedback_sources (
            id,
            name,
            source_url,
            status,
            description,
            last_analyzed_at,
            created_by,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasksWithDetails = data?.map(task => ({
        ...task,
        priority: task.priority as 'high' | 'medium' | 'low',
        status: task.status as 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed',
        source_feedback: task.feedback_sources ? {
          ...task.feedback_sources,
          status: task.feedback_sources.status as 'active' | 'inactive' | 'archived'
        } : undefined,
        total_score: task.frequency_score + task.impact_score,
        feedback_count: 1 // This would need to be calculated based on actual feedback links
      })) || [];

      setTaskCandidates(tasksWithDetails);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch task candidates';
      setError(errorMessage);
      toast({
        title: "오류 발생",
        description: "과제 후보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTaskCandidate = async (task: Omit<TaskCandidate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('task_candidates')
        .insert([task])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "성공",
        description: "새 과제 후보가 생성되었습니다.",
      });

      await fetchTaskCandidates();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task candidate';
      toast({
        title: "오류 발생",
        description: "과제 후보 생성에 실패했습니다.",
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskCandidate['status']) => {
    try {
      const { error } = await supabase
        .from('task_candidates')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "과제 상태가 업데이트되었습니다.",
      });

      await fetchTaskCandidates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
      toast({
        title: "오류 발생",
        description: "과제 상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchTaskCandidates();
  }, []);

  return {
    taskCandidates,
    loading,
    error,
    refetch: fetchTaskCandidates,
    createTaskCandidate,
    updateTaskStatus
  };
}