import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Eye, Download, Share2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ContentData {
  id: string;
  title: string;
  type: "faq" | "notice" | "guide" | "banner" | "message";
  content: string;
  status: "draft" | "review" | "approved" | "published";
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  taskId?: string;
}

interface ContentCardProps {
  content: ContentData;
  className?: string;
}

const typeLabels = {
  faq: "FAQ",
  notice: "공지사항",
  guide: "가이드",
  banner: "배너",
  message: "메시지",
};

const typeColors = {
  faq: "bg-blue-100 text-blue-700",
  notice: "bg-green-100 text-green-700",
  guide: "bg-purple-100 text-purple-700",
  banner: "bg-orange-100 text-orange-700",
  message: "bg-pink-100 text-pink-700",
};

const statusIcons = {
  draft: Clock,
  review: AlertCircle,
  approved: CheckCircle,
  published: CheckCircle,
};

const statusColors = {
  draft: "text-muted-foreground bg-muted/50",
  review: "text-warning bg-warning/10",
  approved: "text-success bg-success/10",
  published: "text-success bg-success/20",
};

export function ContentCard({ content, className }: ContentCardProps) {
  const StatusIcon = statusIcons[content.status];
  
  return (
    <Card className={cn("glass-card p-5 hover:shadow-lg transition-all duration-300 animate-slide-up", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={cn("text-xs", typeColors[content.type])}>
              {typeLabels[content.type]}
            </Badge>
            <div className={cn("flex items-center space-x-1 px-2 py-1 rounded-lg text-xs", statusColors[content.status])}>
              <StatusIcon className="h-3 w-3" />
              <span>{content.status}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-korean leading-snug line-clamp-2">
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground text-korean leading-relaxed line-clamp-3">
            {content.content}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{content.wordCount}자</span>
          <span>업데이트: {content.updatedAt}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-3 border-t border-card-border">
          {content.status === "draft" && (
            <Button size="sm" className="btn-gradient flex-1">
              검토 요청
            </Button>
          )}
          {content.status === "approved" && (
            <Button size="sm" className="btn-gradient flex-1">
              게시하기
            </Button>
          )}
          {content.status === "published" && (
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              다운로드
            </Button>
          )}
          <Button variant="outline" size="sm">
            편집
          </Button>
        </div>
      </div>
    </Card>
  );
}