import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskCandidate, TaskCandidateWithDetails } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function useTaskCandidates() {
  const [taskCandidates, setTaskCandidates] = useState<TaskCandidateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const { toast } = useToast();

  const fetchTaskCandidates = async (page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching task candidates...', { page, size });

      // 총 개수 조회 (head 사용하지 않음)
      const { count, error: countError } = await supabase
        .from('task_candidates')
        .select('*', { count: 'exact' })
        .range(0, 0);

      if (countError) {
        console.error('Count error:', countError);
        throw countError;
      }

      console.log('Total count:', count);
      setTotalCount(count || 0);

      // 페이지네이션된 데이터 조회
      const from = (page - 1) * size;
      const to = from + size - 1;

      const { data, error } = await supabase
        .from('task_candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Data fetch error:', error);
        throw error;
      }

      console.log('Fetched task candidates:', data?.length || 0, 'items');

      const tasksWithDetails = data?.map(task => ({
        ...task,
        priority: task.priority as 'high' | 'medium' | 'low',
        status: task.status as 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed',
        total_score: (task.frequency_score || 0) + (task.impact_score || 0),
        feedback_count: 1
      })) || [];

      setTaskCandidates(tasksWithDetails);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch task candidates';
      console.error('fetchTaskCandidates error:', err);
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
    fetchTaskCandidates(1);
  }, []);

  const nextPage = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (currentPage < totalPages) {
      fetchTaskCandidates(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      fetchTaskCandidates(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page >= 1 && page <= totalPages) {
      fetchTaskCandidates(page);
    }
  };

  return {
    taskCandidates,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    refetch: () => fetchTaskCandidates(currentPage),
    createTaskCandidate,
    updateTaskStatus,
    nextPage,
    prevPage,
    goToPage
  };
}