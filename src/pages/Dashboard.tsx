import { StatsCard } from "@/components/dashboard/StatsCard";
import { VocCard } from "@/components/dashboard/VocCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, FileText, Zap, TrendingUp, Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Sample data
const stats = [
  { title: "이번 주 VOC", value: 127, change: "+12%", changeType: "positive" as const, icon: MessageSquare },
  { title: "생성된 과제", value: 8, change: "+3", changeType: "positive" as const, icon: FileText },
  { title: "자동 생성 문서", value: 24, change: "+15", changeType: "positive" as const, icon: Zap },
  { title: "평균 처리 시간", value: "2.3시간", change: "-30%", changeType: "positive" as const, icon: TrendingUp },
];

const recentVocs = [
  {
    id: "1",
    text: "앱에서 결제할 때 카드 정보 입력 후 오류가 발생해요. 몇 번 시도해도 같은 문제가 반복됩니다.",
    channel: "고객센터",
    date: "2024-01-15",
    sentiment: "negative" as const,
    tag: "bug" as const,
    priority: "high" as const,
  },
  {
    id: "2", 
    text: "다크모드 기능이 있으면 좋겠어요. 밤에 사용할 때 너무 눈이 부셔서 불편합니다.",
    channel: "앱스토어 리뷰",
    date: "2024-01-15",
    sentiment: "neutral" as const,
    tag: "request" as const,
    priority: "medium" as const,
  },
  {
    id: "3",
    text: "새로운 UI가 정말 깔끔하고 사용하기 편해졌어요. 특히 검색 기능이 훨씬 빨라진 것 같습니다.",
    channel: "SNS",
    date: "2024-01-14",
    sentiment: "positive" as const,
    tag: "compliment" as const,
    priority: "low" as const,
  },
];

const priorityTasks = [
  {
    id: "1",
    title: "결제 프로세스 오류 수정",
    description: "카드 결제 시 발생하는 오류를 해결하고 결제 성공률을 개선해야 합니다.",
    linkedFeedbackCount: 15,
    frequencyScore: 45,
    impactScore: 42,
    priority: "high" as const,
    estimatedHours: 16,
    assignee: "김개발",
    status: "in-progress" as const,
  },
  {
    id: "2",
    title: "다크모드 UI 구현",
    description: "사용자 요청이 많은 다크모드 테마를 구현하여 사용성을 개선합니다.",
    linkedFeedbackCount: 8,
    frequencyScore: 32,
    impactScore: 28,
    priority: "medium" as const,
    estimatedHours: 24,
    status: "pending" as const,
  },
];

const recentContent = [
  {
    id: "1",
    title: "결제 오류 해결 가이드",
    type: "guide" as const,
    content: "결제 과정에서 발생할 수 있는 오류들과 해결 방법을 안내하는 사용자 가이드입니다.",
    status: "approved" as const,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
    wordCount: 842,
    taskId: "1",
  },
  {
    id: "2",
    title: "다크모드 기능 출시 안내",
    type: "notice" as const,
    content: "사용자 요청에 따라 곧 출시될 다크모드 기능에 대한 공지사항입니다.",
    status: "draft" as const,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
    wordCount: 256,
    taskId: "2",
  },
];

export default function Dashboard() {
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
              {recentVocs.map((voc) => (
                <VocCard key={voc.id} voc={voc} />
              ))}
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
              {priorityTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
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
              {recentContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
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
                    <span className="text-muted-foreground text-korean">VOC 분석</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground text-korean">과제 생성</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground text-korean">문서 작성</span>
                    <span className="font-medium">91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}