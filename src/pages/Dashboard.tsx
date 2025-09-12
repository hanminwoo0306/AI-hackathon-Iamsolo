import { VocCard } from "@/components/dashboard/VocCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TaskSelector } from "@/components/dashboard/TaskSelector";
import { PRDChatInterface } from "@/components/dashboard/PRDChatInterface";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PRDDetailModal } from "@/components/dashboard/PRDDetailModal";
import { ServiceLaunchModal } from "@/components/dashboard/ServiceLaunchModal";
import { MessageSquare, FileText, Zap, Plus, ExternalLink, Play, Edit, Eye, Calendar, Rocket } from "lucide-react";
import { useFeedbackSources } from "@/hooks/useFeedbackSources";
import { useTaskCandidates } from "@/hooks/useTaskCandidates";
import { useContentAssets } from "@/hooks/useContentAssets";
import { usePRDDrafts } from "@/hooks/usePRDDrafts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TaskCandidateWithDetails, PRDDraft } from "@/types/database";
import { useState } from "react";

export default function Dashboard() {
  const { feedbackSources, loading: feedbackLoading, refetch: refetchSources } = useFeedbackSources();
  const { taskCandidates, loading: tasksLoading, updateTaskStatus, refetch: refetchTasks, totalCount, currentPage, totalPages, nextPage, prevPage, goToPage } = useTaskCandidates();
  const { contentAssets, loading: contentLoading, updateContentStatus } = useContentAssets();
  const { prdDrafts, loading: prdLoading, refetch: refetchPRDs } = usePRDDrafts();
  const { toast } = useToast();
  const [selectedPRD, setSelectedPRD] = useState<PRDDraft | null>(null);
  const [serviceLaunchPRD, setServiceLaunchPRD] = useState<PRDDraft | null>(null);

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
      console.log('PRD 생성 시작:', task);
      
      toast({
        title: "PRD 생성 중",
        description: `${task.title}에 대한 PRD를 생성하고 있습니다...`,
      });

      const response = await supabase.functions.invoke('gemini-prd-generation', {
        body: { task }
      });

      console.log('Edge Function Response:', response);

      // 응답 상태 확인
      if (response.error) {
        console.error('Edge Function Error:', response.error);
        throw new Error(`PRD 생성 실패: ${response.error.message || response.error}`);
      }

      if (!response.data) {
        throw new Error('PRD 생성 실패: 응답 데이터가 없습니다');
      }

      const data = response.data;
      
      if (!data.success) {
        const errorMessage = data.error || 'PRD 생성에 실패했습니다';
        console.error('PRD Generation failed:', errorMessage);
        throw new Error(`PRD 생성 실패: ${errorMessage}`);
      }

      if (!data.prd) {
        throw new Error('PRD 생성 실패: PRD 데이터가 응답에 포함되지 않았습니다');
      }

      console.log('PRD 생성 성공:', data.prd);
      
      toast({
        title: "PRD 생성 완료",
        description: "PRD가 성공적으로 생성되었습니다.",
      });

      await refetchPRDs();
      
    } catch (error: any) {
      console.error('PRD Creation Error:', error);
      
      let errorMessage = "PRD 생성 중 오류가 발생했습니다.";
      
      if (error.message) {
        if (error.message.includes('Authorization')) {
          errorMessage = "인증 오류가 발생했습니다. 다시 로그인해주세요.";
        } else if (error.message.includes('GEMINI_API_KEY')) {
          errorMessage = "AI 서비스 설정에 문제가 있습니다. 관리자에게 문의하세요.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "PRD 생성 실패",
        description: errorMessage,
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
          <h1 className="text-3xl font-bold text-foreground text-korean">PM 업무 도와주는 루프스테이션</h1>
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
                <Button onClick={handleExecuteAnalysis} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  분석 실행
                </Button>
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
              {(() => {
                const sortedTasks = taskCandidates
                  .sort((a, b) => {
                    // 개발비용 * 효과점수가 낮을수록 우선순위가 높음
                    const aPriority = (a.development_cost || 1) * (a.effect_score || 1);
                    const bPriority = (b.development_cost || 1) * (b.effect_score || 1);
                    return aPriority - bPriority;
                  });
                console.log('[Dashboard] Passing tasks to TaskSelector:', { len: sortedTasks.length, totalCount, currentPage, totalPages });
                return (
                  <TaskSelector
                    tasks={sortedTasks.slice(0, 5)}
                    totalCount={Math.min(totalCount, 5)}
                    currentPage={currentPage}
                    totalPages={Math.ceil(Math.min(totalCount, 5) / 5)}
                    onCreatePRD={handleCreatePRD}
                    onNextPage={nextPage}
                    onPrevPage={prevPage}
                    onGoToPage={goToPage}
                    loading={tasksLoading}
                  />
                );
              })()}
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
                  <div key={prd.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-korean mb-2">{prd.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <Badge variant="outline" className="mr-1">
                              {prd.status}
                            </Badge>
                          </span>
                          <span>버전: {prd.version}</span>
                          <span>{new Date(prd.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {/* PRD 내용 미리보기 */}
                        <div className="text-sm text-muted-foreground">
                          {prd.background ? (
                            <p className="line-clamp-2">{prd.background.slice(0, 100)}...</p>
                          ) : (
                            <p className="italic">PRD 내용이 생성되지 않았습니다.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPRD(prd)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        편집
                      </Button>
                      <PRDDetailModal prd={prd} onEdit={setSelectedPRD} />
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setServiceLaunchPRD(prd)}
                      >
                        <Rocket className="h-4 w-4 mr-1" />
                        서비스 런칭
                      </Button>
                    </div>
                  </div>
                ))}
                {prdDrafts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>아직 생성된 PRD가 없습니다.</p>
                    <p className="text-sm mt-2">위의 과제 후보에서 PRD를 생성해보세요.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. 서비스 런칭 안내 영역 */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-korean flex items-center">
                <Rocket className="h-5 w-5 mr-2" />
                서비스 런칭 준비
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  PRD를 선택한 후 서비스 런칭 버튼을 클릭하여<br />
                  서비스 런칭에 필요한 콘텐츠를 자동 생성하세요.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• 서비스 화면 이미지 3개 업로드</p>
                  <p>• 고객센터 설명자료 자동 생성</p>
                  <p>• FAQ, 서비스 소개 콘텐츠 생성</p>
                  <p>• 알림 메시지, 배너 메시지 생성</p>
                </div>
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

        {/* Service Launch Modal */}
        {serviceLaunchPRD && (
          <ServiceLaunchModal
            prd={serviceLaunchPRD}
            onClose={() => setServiceLaunchPRD(null)}
          />
        )}
      </div>
    </div>
  );
}