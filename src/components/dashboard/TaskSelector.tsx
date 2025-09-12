import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, FileText } from "lucide-react";
import { TaskCandidateWithDetails } from "@/types/database";
import { cn } from "@/lib/utils";

interface TaskSelectorProps {
  tasks: TaskCandidateWithDetails[];
  onCreatePRD: (selectedTask: TaskCandidateWithDetails) => void;
  loading?: boolean;
}

const priorityColors = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground", 
  low: "bg-muted text-muted-foreground",
};

const statusLabels = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거부됨",
  in_progress: "진행중",
  completed: "완료",
};

export function TaskSelector({ tasks, onCreatePRD, loading }: TaskSelectorProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  const handleCreatePRD = () => {
    if (selectedTask) {
      onCreatePRD(selectedTask);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        아직 생성된 과제가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {tasks.map((task) => {
          const isSelected = selectedTaskId === task.id;
          const priority = (task.development_cost || 1) * (task.effect_score || 1);
          
          return (
            <Card key={task.id} className={cn(
              "glass-card cursor-pointer transition-all duration-200 hover:shadow-lg",
              isSelected && "ring-2 ring-primary bg-primary/5"
            )} onClick={() => setSelectedTaskId(task.id)}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={cn("text-xs", priorityColors[task.priority])}>
                          {task.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[task.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>우선순위: {priority}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="font-medium text-foreground text-korean">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-korean">
                          {task.description.split('[분석 메트릭]')[0].trim()}
                        </p>
                      )}
                    </div>

                    {/* Metrics */}
                    {(task.development_cost || task.effect_score) && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {task.development_cost && (
                          <div>
                            <span className="text-muted-foreground">개발비용: </span>
                            <span className="font-medium">{task.development_cost} MM</span>
                          </div>
                        )}
                        {task.effect_score && (
                          <div>
                            <span className="text-muted-foreground">효과: </span>
                            <span className="font-medium">
                              {task.effect_score === 1 ? '좋음' : task.effect_score === 2 ? '보통' : '낮음'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="pt-4 border-t">
        <Button 
          className="w-full btn-gradient" 
          disabled={!selectedTask}
          onClick={handleCreatePRD}
        >
          <FileText className="h-4 w-4 mr-2" />
          선택된 과제로 PRD 생성
        </Button>
      </div>
    </div>
  );
}