import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, Users, TrendingUp, FileText } from "lucide-react";
import { TaskCandidateWithDetails } from "@/types/database";

interface TaskCardProps {
  task: TaskCandidateWithDetails;
  className?: string;
  onCreatePRD?: (task: TaskCandidateWithDetails) => void;
  onUpdateStatus?: (id: string, status: TaskCandidateWithDetails['status']) => void;
}

const statusColors = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
};

const statusLabels = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거부됨",
  in_progress: "진행중",
  completed: "완료",
};

const priorityColors = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground", 
  low: "bg-muted text-muted-foreground",
};

export function TaskCard({ task, className, onCreatePRD, onUpdateStatus }: TaskCardProps) {
  const totalScore = task.total_score || (task.frequency_score + task.impact_score);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <Card className={cn("glass-card p-6 hover:shadow-lg transition-all duration-300 animate-slide-up", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", priorityColors[task.priority])}>
              {task.priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", statusColors[task.status])}>
              {statusLabels[task.status]}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{totalScore}점</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-korean leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground text-korean leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">빈도점수</span>
              <span className="font-medium">{task.frequency_score}/50</span>
            </div>
            <Progress value={(task.frequency_score / 50) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">영향점수</span>
              <span className="font-medium">{task.impact_score}/50</span>
            </div>
            <Progress value={(task.impact_score / 50) * 100} className="h-2" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-muted-foreground">
            {task.source_feedback && (
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>피드백 연결됨</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDate(task.created_at)}</span>
            </span>
          </div>
          {task.source_feedback && (
            <div className="flex items-center space-x-2">
              <div className="text-xs text-muted-foreground">
                출처: {task.source_feedback.name}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-3 border-t border-card-border">
          {task.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus?.(task.id, 'approved')}
            >
              승인
            </Button>
          )}
          {(task.status === 'approved' || task.status === 'in_progress') && (
            <Button 
              size="sm" 
              className="btn-gradient flex-1"
              onClick={() => onCreatePRD?.(task)}
            >
              <FileText className="h-4 w-4 mr-2" />
              PRD 생성
            </Button>
          )}
          <Button variant="outline" size="sm">
            상세보기
          </Button>
        </div>
      </div>
    </Card>
  );
}