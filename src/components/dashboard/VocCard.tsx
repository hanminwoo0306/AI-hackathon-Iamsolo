import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThumbsDown, ThumbsUp, Minus, ExternalLink, BarChart3 } from "lucide-react";
import { FeedbackSourceWithAnalysis } from "@/types/database";

interface VocCardProps {
  feedbackSource: FeedbackSourceWithAnalysis;
  className?: string;
  onAnalyze?: (source: FeedbackSourceWithAnalysis) => void;
  onCreateTask?: (source: FeedbackSourceWithAnalysis) => void;
}

const statusColors = {
  active: "text-success bg-success/10",
  inactive: "text-muted-foreground bg-muted/50",
  archived: "text-warning bg-warning/10",
};

const analysisTypeLabels = {
  sentiment: "감성분석",
  categorization: "카테고리화",
  summary: "요약",
  task_extraction: "과제추출",
};

export function VocCard({ feedbackSource, className, onAnalyze, onCreateTask }: VocCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExternalLink = () => {
    if (feedbackSource.source_url) {
      window.open(feedbackSource.source_url, '_blank');
    }
  };
  
  return (
    <Card className={cn("glass-card p-5 hover:shadow-lg transition-all duration-300 animate-slide-up", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn("p-1.5 rounded-lg", statusColors[feedbackSource.status])}>
              <BarChart3 className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-xs">
              {feedbackSource.status === 'active' ? '활성' : feedbackSource.status === 'inactive' ? '비활성' : '보관됨'}
            </Badge>
            {feedbackSource.analysis_count && feedbackSource.analysis_count > 0 && (
              <Badge className="text-xs bg-primary text-primary-foreground">
                분석 {feedbackSource.analysis_count}회
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleExternalLink}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-korean leading-snug">
            {feedbackSource.name}
          </h3>
          {feedbackSource.description && (
            <p className="text-sm text-muted-foreground leading-relaxed text-korean line-clamp-2">
              {feedbackSource.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Google Sheets</span>
            <span>
              {feedbackSource.last_analyzed_at 
                ? `분석: ${formatDate(feedbackSource.last_analyzed_at)}`
                : `생성: ${formatDate(feedbackSource.created_at)}`
              }
            </span>
          </div>

          {/* analysis_results 테이블이 삭제되어 최근 분석 정보는 표시하지 않음 */}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2 border-t border-card-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex-1"
            onClick={() => onCreateTask?.(feedbackSource)}
          >
            과제 생성
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => onAnalyze?.(feedbackSource)}
          >
            분석
          </Button>
        </div>
      </div>
    </Card>
  );
}