import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PRDDraft } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const usePRDDrafts = () => {
  const [prdDrafts, setPRDDrafts] = useState<PRDDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPRDDrafts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prd_drafts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPRDDrafts((data || []) as PRDDraft[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "오류",
        description: "PRD 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPRDDraft = async (prdData: Omit<PRDDraft, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('prd_drafts')
        .insert([prdData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "성공",
        description: "PRD가 성공적으로 생성되었습니다.",
      });

      await fetchPRDDrafts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: "오류",
        description: "PRD 생성에 실패했습니다.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePRDStatus = async (id: string, status: PRDDraft['status']) => {
    try {
      const { error } = await supabase
        .from('prd_drafts')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "성공",
        description: "PRD 상태가 업데이트되었습니다.",
      });

      await fetchPRDDrafts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: "오류",
        description: "PRD 상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPRDDrafts();
  }, []);

  const refetch = () => fetchPRDDrafts();

  return {
    prdDrafts,
    loading,
    error,
    refetch,
    createPRDDraft,
    updatePRDStatus,
  };
};