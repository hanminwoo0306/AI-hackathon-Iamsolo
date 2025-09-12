import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentAsset, ContentAssetWithDetails } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function useContentAssets() {
  const [contentAssets, setContentAssets] = useState<ContentAssetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContentAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('content_assets')
        .select(`
          *,
          task_candidates (
            id,
            title,
            description,
            source_feedback_id,
            frequency_score,
            impact_score,
            priority,
            status,
            created_by,
            created_at,
            updated_at
          ),
          prd_drafts (
            id,
            task_id,
            title,
            background,
            problem,
            solution,
            ux_requirements,
            edge_cases,
            status,
            version,
            output_url,
            created_by,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assetsWithDetails = data?.map(asset => ({
        ...asset,
        type: asset.type as 'faq' | 'banner' | 'notification' | 'guide' | 'announcement',
        status: asset.status as 'draft' | 'review' | 'approved' | 'published',
        target_channel: asset.target_channel as 'slack' | 'confluence' | 'blog' | 'customer_center' | 'app_popup' | undefined,
        task: asset.task_candidates ? {
          ...asset.task_candidates,
          priority: asset.task_candidates.priority as 'high' | 'medium' | 'low',
          status: asset.task_candidates.status as 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
        } : undefined,
        prd: asset.prd_drafts ? {
          ...asset.prd_drafts,
          status: asset.prd_drafts.status as 'draft' | 'review' | 'approved' | 'published'
        } : undefined,
        word_count: asset.content?.length || 0
      })) || [];

      setContentAssets(assetsWithDetails);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content assets';
      setError(errorMessage);
      toast({
        title: "오류 발생",
        description: "콘텐츠를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContentAsset = async (asset: Omit<ContentAsset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('content_assets')
        .insert([asset])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "성공",
        description: "새 콘텐츠가 생성되었습니다.",
      });

      await fetchContentAssets();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create content asset';
      toast({
        title: "오류 발생",
        description: "콘텐츠 생성에 실패했습니다.",
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  const updateContentStatus = async (id: string, status: ContentAsset['status']) => {
    try {
      const { error } = await supabase
        .from('content_assets')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "콘텐츠 상태가 업데이트되었습니다.",
      });

      await fetchContentAssets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update content status';
      toast({
        title: "오류 발생",
        description: "콘텐츠 상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchContentAssets();
  }, []);

  return {
    contentAssets,
    loading,
    error,
    refetch: fetchContentAssets,
    createContentAsset,
    updateContentStatus
  };
}