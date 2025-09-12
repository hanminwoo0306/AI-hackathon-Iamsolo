import { VocCard } from "@/components/dashboard/VocCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TaskSelector } from "@/components/dashboard/TaskSelector";
import { PRDChatInterface } from "@/components/dashboard/PRDChatInterface";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, FileText, Zap, Plus, ExternalLink, Play } from "lucide-react";
import { useFeedbackSources } from "@/hooks/useFeedbackSources";
import { useTaskCandidates } from "@/hooks/useTaskCandidates";
import { useContentAssets } from "@/hooks/useContentAssets";
import { usePRDDrafts } from "@/hooks/usePRDDrafts";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TaskCandidateWithDetails, PRDDraft } from "@/types/database";
import { useState } from "react";

export default function Dashboard() {
  const { feedbackSources, loading: feedbackLoading, refetch: refetchSources } = useFeedbackSources();
  const { taskCandidates, loading: tasksLoading, updateTaskStatus, refetch: refetchTasks } = useTaskCandidates();
  const { contentAssets, loading: contentLoading, updateContentStatus } = useContentAssets();
  const { prdDrafts, loading: prdLoading, refetch: refetchPRDs } = usePRDDrafts();
  const { toast } = useToast();
  const [selectedPRD, setSelectedPRD] = useState<PRDDraft | null>(null);

  const handleAnalyzeFeedback = (source: any) => {
    toast({
      title: "분석 시작",
      description: `${source.name}에 대한 분석을 시작합니다.`,
    });
    // TODO: Implement analysis logic
  };

  const handleCreateTask = (source: any) => {
    toast({
      title: "과제 생성",
      description: `${source.name}에서 과제를 생성합니다.`,
    });
    // TODO: Implement task creation logic
  };

  const handleCreatePRD = async (task: TaskCandidateWithDetails) => {
    try {
      toast({
        title: "PRD 생성 중",
        description: `${task.title}에 대한 PRD를 생성하고 있습니다...`,
      });

      const { data, error } = await supabase.functions.invoke('gemini-prd-generation', {
        body: { task }
      });

      if (error) throw error;

      if (data.success && data.prd) {
        // Save PRD to database
        const { error: insertError } = await supabase
          .from('prd_drafts')
          .insert([data.prd]);

        if (insertError) throw insertError;

        toast({
          title: "PRD 생성 완료",
          description: "PRD가 성공적으로 생성되었습니다.",
        });

        await refetchPRDs();
      } else {
        throw new Error(data.error || 'PRD 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('PRD Creation Error:', error);
      toast({
        title: "PRD 생성 실패",
        description: error.message || "PRD 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleExecuteAnalysis = async () => {
    const spreadsheetInput = document.querySelector('input[placeholder*="Google Spreadsheets"]') as HTMLInputElement;
    const spreadsheetUrl = spreadsheetInput?.value;

    if (!spreadsheetUrl) {
      toast({
        title: "오류",
        description: "Google Spreadsheets 링크를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "분석 실행",
      description: "VOC 분석을 시작합니다. 잠시만 기다려주세요...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('gemini-voc-analysis', {
        body: {
          spreadsheetUrl,
          userPrompt: '고객 피드백을 체계적으로 분석하여 개선 과제를 도출해주세요.'
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "분석 완료",
          description: "VOC 분석이 성공적으로 완료되었습니다.",
        });
        // 입력창 초기화
        if (spreadsheetInput) {
          spreadsheetInput.value = '';
        }
        // 영역만 갱신
        await Promise.all([
          refetchTasks(),
          refetchSources(),
          refetchPRDs(),
        ]);
      } else {
        throw new Error(data.error || '분석 실행 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('VOC Analysis Error:', error);
      toast({
        title: "분석 실패",
        description: error.message || "VOC 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateContent = (type: string) => {
    toast({
      title: "콘텐츠 생성",
      description: `${type} 생성을 시작합니다.`,
    });
    // TODO: Implement content generation logic
  };

  const handleUpdateTaskStatus = async (id: string, status: any) => {
    try {
      await updateTaskStatus(id, status);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdateContentStatus = async (id: string, status: any) => {
    try {
      await updateContentStatus(id, status);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isLoading = feedbackLoading || tasksLoading || contentLoading || prdLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground text-korean">VOC 분석 자동화 시스템</h1>
          <p className="text-muted-foreground text-korean mt-2">
            Google Spreadsheets VOC 데이터를 분석하여 과제와 콘텐츠를 자동 생성합니다
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. VOC 입력 영역 */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-korean flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                최근 VOC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input 
                  placeholder="Google Spreadsheets 링크를 입력하세요" 
                  className="w-full"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleExecuteAnalysis} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    분석 실행
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    링크 열기
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                {feedbackSources.slice(0, 3).map((source) => (
                  <VocCard 
                    key={source.id} 
                    feedbackSource={source}
                    onAnalyze={handleAnalyzeFeedback}
                    onCreateTask={handleCreateTask}
                  />
                ))}
                {feedbackSources.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    아직 피드백 소스가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. 분석 결과 조회 영역 */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-korean flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                분석 결과 조회
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskSelector
                tasks={taskCandidates
                  .sort((a, b) => {
                    // 개발비용 * 효과점수가 낮을수록 우선순위가 높음
                    const aPriority = (a.development_cost || 1) * (a.effect_score || 1);
                    const bPriority = (b.development_cost || 1) * (b.effect_score || 1);
                    return aPriority - bPriority;
                  })
                  .slice(0, 10)
                }
                onCreatePRD={handleCreatePRD}
                loading={tasksLoading}
              />
            </CardContent>
          </Card>

          {/* 3. PRD 조회 영역 */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-korean flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                PRD 조회
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prdDrafts.slice(0, 5).map((prd) => (
                  <div key={prd.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-korean">{prd.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      상태: {prd.status} | 버전: {prd.version} | {new Date(prd.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPRD(prd)}
                      >
                        편집
                      </Button>
                      <Button variant="outline" size="sm">
                        전체 조회
                      </Button>
                    </div>
                  </div>
                ))}
                {prdDrafts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    아직 생성된 PRD가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. 자동화 실행 영역 */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-korean flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                자동화 실행
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent("고객센터 설명자료")}
                >
                  고객센터 설명자료 생성
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent("FAQ")}
                >
                  FAQ 작성
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent("서비스 콘텐츠")}
                >
                  서비스 콘텐츠 생성
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent("알림 메시지")}
                >
                  알림 메시지 생성
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent("배너 메시지")}
                >
                  배너 메시지 생성
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRD Chat Interface Modal */}
        {selectedPRD && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl">
              <PRDChatInterface
                prd={selectedPRD}
                onUpdate={(updatedPRD) => {
                  setSelectedPRD(updatedPRD);
                  refetchPRDs();
                }}
                onClose={() => setSelectedPRD(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}