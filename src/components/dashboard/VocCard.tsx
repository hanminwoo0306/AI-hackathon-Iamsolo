import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThumbsDown, ThumbsUp, Minus, ExternalLink } from "lucide-react";

interface VocData {
  id: string;
  text: string;
  channel: string;
  date: string;
  sentiment: "positive" | "negative" | "neutral";
  tag: "bug" | "request" | "compliment" | "suggestion";
  priority: "high" | "medium" | "low";
}

interface VocCardProps {
  voc: VocData;
  className?: string;
}

const sentimentIcons = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  neutral: Minus,
};

const sentimentColors = {
  positive: "text-success bg-success/10",
  negative: "text-destructive bg-destructive/10", 
  neutral: "text-muted-foreground bg-muted/50",
};

const tagColors = {
  bug: "bg-destructive/10 text-destructive",
  request: "bg-primary/10 text-primary",
  compliment: "bg-success/10 text-success",
  suggestion: "bg-warning/10 text-warning",
};

const priorityColors = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

export function VocCard({ voc, className }: VocCardProps) {
  const SentimentIcon = sentimentIcons[voc.sentiment];
  
  return (
    <Card className={cn("glass-card p-5 hover:shadow-lg transition-all duration-300 animate-slide-up", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn("p-1.5 rounded-lg", sentimentColors[voc.sentiment])}>
              <SentimentIcon className="h-4 w-4" />
            </div>
            <Badge variant="outline" className={cn("text-xs", tagColors[voc.tag])}>
              {voc.tag}
            </Badge>
            <Badge className={cn("text-xs", priorityColors[voc.priority])}>
              {voc.priority.toUpperCase()}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed text-korean line-clamp-3">
            {voc.text}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center space-x-2">
              <span>출처: {voc.channel}</span>
            </span>
            <span>{voc.date}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2 border-t border-card-border">
          <Button variant="outline" size="sm" className="text-xs">
            과제 생성
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            세부 분석
          </Button>
        </div>
      </div>
    </Card>
  );
}