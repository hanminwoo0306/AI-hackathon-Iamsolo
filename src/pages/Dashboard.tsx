import { StatsCard } from "@/components/dashboard/StatsCard";
import { VocCard } from "@/components/dashboard/VocCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, FileText, Zap, TrendingUp, Plus, Filter } from "lucide-react";
import { useFeedbackSources } from "@/hooks/useFeedbackSources";
import { useTaskCandidates } from "@/hooks/useTaskCandidates";
import { useContentAssets } from "@/hooks/useContentAssets";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { feedbackSources, loading: feedbackLoading } = useFeedbackSources();
  const { taskCandidates, loading: tasksLoading, updateTaskStatus } = useTaskCandidates();
  const { contentAssets, loading: contentLoading, updateContentStatus } = useContentAssets();
  const { toast } = useToast();

  // Calculate stats from real data
  const stats = [
    { 
      title: "활성 피드백 소스", 
      value: feedbackSources.filter(f => f.status === 'active').length, 
      change: "+12%", 
      changeType: "positive" as const, 
      icon: MessageSquare 
    },
    { 
      title: "생성된 과제", 
      value: taskCandidates.length, 
      change: "+3", 
      changeType: "positive" as const, 
      icon: FileText 
    },
    { 
      title: "자동 생성 문서", 
      value: contentAssets.length, 
      change: "+15", 
      changeType: "positive" as const, 
      icon: Zap 
    },
    { 
      title: "완료된 과제", 
      value: taskCandidates.filter(t => t.status === 'completed').length, 
      change: "-30%", 
      changeType: "positive" as const, 
      icon: TrendingUp 
    },
  ];

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

  const handleCreatePRD = (task: any) => {
    toast({
      title: "PRD 생성",
      description: `${task.title}에 대한 PRD를 생성합니다.`,
    });
    // TODO: Implement PRD creation logic
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

  const isLoading = feedbackLoading || tasksLoading || contentLoading;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-korean">VOC 대시보드</h1>
            <p className="text-muted-foreground text-korean mt-1">
              고객 피드백을 분석하고 자동으로 과제와 문서를 생성합니다
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="text-korean">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            <Button className="btn-gradient text-korean">
              <Plus className="h-4 w-4 mr-2" />
              새 분석
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* VOC Analysis */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground text-korean">최근 VOC</h2>
              <Button variant="ghost" size="sm" className="text-korean">
                전체보기
              </Button>
            </div>
            <div className="space-y-4">
              {feedbackSources.slice(0, 3).map((source) => (
                <VocCard 
                  key={source.id} 
                  feedbackSource={source}
                  onAnalyze={handleAnalyzeFeedback}
                  onCreateTask={handleCreateTask}
                />
              ))}
              {feedbackSources.length === 0 && (
                <Card className="glass-card p-6 text-center">
                  <p className="text-muted-foreground">아직 피드백 소스가 없습니다.</p>
                  <Button variant="outline" className="mt-2">
                    첫 번째 소스 추가하기
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Task Management */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground text-korean">우선순위 과제</h2>
              <Button variant="ghost" size="sm" className="text-korean">
                전체보기
              </Button>
            </div>
            <div className="space-y-4">
              {taskCandidates.slice(0, 3).map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onCreatePRD={handleCreatePRD}
                  onUpdateStatus={handleUpdateTaskStatus}
                />
              ))}
              {taskCandidates.length === 0 && (
                <Card className="glass-card p-6 text-center">
                  <p className="text-muted-foreground">아직 생성된 과제가 없습니다.</p>
                  <Button variant="outline" className="mt-2">
                    과제 생성하기
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Content & Analytics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground text-korean">생성된 콘텐츠</h2>
              <Button variant="ghost" size="sm" className="text-korean">
                전체보기
              </Button>
            </div>
            <div className="space-y-4">
              {contentAssets.slice(0, 3).map((content) => (
                <ContentCard 
                  key={content.id} 
                  content={content}
                  onUpdateStatus={handleUpdateContentStatus}
                />
              ))}
              {contentAssets.length === 0 && (
                <Card className="glass-card p-6 text-center">
                  <p className="text-muted-foreground">아직 생성된 콘텐츠가 없습니다.</p>
                  <Button variant="outline" className="mt-2">
                    콘텐츠 생성하기
                  </Button>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <Card className="glass-card p-6">
              <h3 className="font-semibold text-foreground text-korean mb-4">빠른 작업</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-korean">
                  <MessageSquare className="h-4 w-4 mr-3" />
                  VOC 수동 입력
                </Button>
                <Button variant="outline" className="w-full justify-start text-korean">
                  <FileText className="h-4 w-4 mr-3" />
                  PRD 템플릿 생성
                </Button>
                <Button variant="outline" className="w-full justify-start text-korean">
                  <Zap className="h-4 w-4 mr-3" />
                  콘텐츠 일괄 생성
                </Button>
              </div>
            </Card>

            {/* Progress Overview */}
            <Card className="glass-card p-6">
              <h3 className="font-semibold text-foreground text-korean mb-4">이번 주 진행률</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground text-korean">활성 피드백 소스</span>
                    <span className="font-medium">{feedbackSources.filter(f => f.status === 'active').length}/{feedbackSources.length}</span>
                  </div>
                  <Progress value={feedbackSources.length > 0 ? (feedbackSources.filter(f => f.status === 'active').length / feedbackSources.length) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground text-korean">승인된 과제</span>
                    <span className="font-medium">{taskCandidates.filter(t => t.status === 'approved' || t.status === 'in_progress' || t.status === 'completed').length}/{taskCandidates.length}</span>
                  </div>
                  <Progress value={taskCandidates.length > 0 ? (taskCandidates.filter(t => t.status === 'approved' || t.status === 'in_progress' || t.status === 'completed').length / taskCandidates.length) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground text-korean">게시된 콘텐츠</span>
                    <span className="font-medium">{contentAssets.filter(c => c.status === 'published').length}/{contentAssets.length}</span>
                  </div>
                  <Progress value={contentAssets.length > 0 ? (contentAssets.filter(c => c.status === 'published').length / contentAssets.length) * 100 : 0} className="h-2" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}