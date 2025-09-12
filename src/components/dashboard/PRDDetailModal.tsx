import { PRDDraft } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Edit, Calendar, FileText } from "lucide-react";

interface PRDDetailModalProps {
  prd: PRDDraft;
  onEdit: (prd: PRDDraft) => void;
}

export function PRDDetailModal({ prd, onEdit }: PRDDetailModalProps) {
  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-yellow-100 text-yellow-800",
      review: "bg-blue-100 text-blue-800", 
      approved: "bg-green-100 text-green-800",
      published: "bg-purple-100 text-purple-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          전체 조회
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {prd.title}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusBadge(prd.status || 'draft')}>
                {prd.status || 'draft'}
              </Badge>
              <span className="text-sm text-muted-foreground">v{prd.version}</span>
              <Button onClick={() => onEdit(prd)} size="sm">
                <Edit className="h-4 w-4 mr-1" />
                편집
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* 메타 정보 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">생성일: {formatDate(prd.created_at)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">수정일: {formatDate(prd.updated_at)}</span>
              </div>
            </div>

            {/* 배경 */}
            {prd.background && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">배경 (Background)</h3>
                <div className="prose prose-sm max-w-none p-4 bg-background border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{prd.background}</pre>
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* 문제 정의 */}
            {prd.problem && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">문제 정의 (Problem)</h3>
                <div className="prose prose-sm max-w-none p-4 bg-background border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{prd.problem}</pre>
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* 해결방안 */}
            {prd.solution && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">해결방안 (Solution)</h3>
                <div className="prose prose-sm max-w-none p-4 bg-background border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{prd.solution}</pre>
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* UX 요구사항 */}
            {prd.ux_requirements && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">UX 요구사항 (UX Requirements)</h3>
                <div className="prose prose-sm max-w-none p-4 bg-background border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{prd.ux_requirements}</pre>
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* 엣지 케이스 */}
            {prd.edge_cases && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">엣지 케이스 (Edge Cases)</h3>
                <div className="prose prose-sm max-w-none p-4 bg-background border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{prd.edge_cases}</pre>
                </div>
              </div>
            )}

            {/* 빈 상태 */}
            {!prd.background && !prd.problem && !prd.solution && !prd.ux_requirements && !prd.edge_cases && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>PRD 내용이 아직 생성되지 않았습니다.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}