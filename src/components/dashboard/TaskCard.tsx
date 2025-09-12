import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, Users, TrendingUp, FileText } from "lucide-react";

interface TaskData {
  id: string;
  title: string;
  description: string;
  linkedFeedbackCount: number;
  frequencyScore: number;
  impactScore: number;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  assignee?: string;
  status: "pending" | "in-progress" | "review" | "completed";
}

interface TaskCardProps {
  task: TaskData;
  className?: string;
}

const statusColors = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/10 text-primary",
  review: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
};

const priorityColors = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground", 
  low: "bg-muted text-muted-foreground",
};

export function TaskCard({ task, className }: TaskCardProps) {
  const totalScore = task.frequencyScore + task.impactScore;
  
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
              {task.status}
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
          <p className="text-sm text-muted-foreground text-korean leading-relaxed line-clamp-2">
            {task.description}
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">빈도점수</span>
              <span className="font-medium">{task.frequencyScore}/50</span>
            </div>
            <Progress value={(task.frequencyScore / 50) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">영향점수</span>
              <span className="font-medium">{task.impactScore}/50</span>
            </div>
            <Progress value={(task.impactScore / 50) * 100} className="h-2" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{task.linkedFeedbackCount}개 피드백</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{task.estimatedHours}시간</span>
            </span>
          </div>
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {task.assignee.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-3 border-t border-card-border">
          <Button size="sm" className="btn-gradient flex-1">
            <FileText className="h-4 w-4 mr-2" />
            PRD 생성
          </Button>
          <Button variant="outline" size="sm">
            상세보기
          </Button>
        </div>
      </div>
    </Card>
  );
}