import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Save, RefreshCw, FileText } from "lucide-react";
import { PRDDraft } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PRDChatInterfaceProps {
  prd: PRDDraft;
  onUpdate: (updatedPRD: PRDDraft) => void;
  onClose: () => void;
}

export function PRDChatInterface({ prd, onUpdate, onClose }: PRDChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `안녕하세요! "${prd.title}" PRD를 개선하기 위해 도와드리겠습니다. 어떤 부분을 수정하거나 보완하고 싶으신가요?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-prd-chat', {
        body: {
          prd: prd,
          userMessage: input,
          chatHistory: messages
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // PRD가 업데이트된 경우
      if (data.updatedPRD) {
        onUpdate(data.updatedPRD);
      }
    } catch (error) {
      console.error('PRD Chat Error:', error);
      toast({
        title: "오류 발생",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePRD = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('prd_drafts')
        .update({
          title: prd.title,
          background: prd.background,
          problem: prd.problem,
          solution: prd.solution,
          ux_requirements: prd.ux_requirements,
          edge_cases: prd.edge_cases,
          updated_at: new Date().toISOString()
        })
        .eq('id', prd.id);

      if (error) throw error;

      toast({
        title: "저장 완료",
        description: "PRD가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "PRD 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-[80vh] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            PRD 개선 어시스턴트
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{prd.status}</Badge>
            <span className="text-sm text-muted-foreground">v{prd.version}</span>
            <Button
              onClick={handleSavePRD}
              disabled={isSaving}
              size="sm"
              variant="outline"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              저장
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              닫기
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          "{prd.title}"을 개선하고 있습니다.
        </div>
      </CardHeader>

      <div className="flex flex-1 min-h-0">
        {/* 좌측: PRD 내용 보기 */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h3 className="font-medium text-sm">현재 PRD 내용</h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* 배경 */}
              {prd.background && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">배경</h4>
                  <div className="text-xs bg-background border rounded p-3">
                    <pre className="whitespace-pre-wrap font-sans">{prd.background}</pre>
                  </div>
                </div>
              )}

              {/* 문제 정의 */}
              {prd.problem && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">문제 정의</h4>
                  <div className="text-xs bg-background border rounded p-3">
                    <pre className="whitespace-pre-wrap font-sans">{prd.problem}</pre>
                  </div>
                </div>
              )}

              {/* 해결방안 */}
              {prd.solution && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">해결방안</h4>
                  <div className="text-xs bg-background border rounded p-3">
                    <pre className="whitespace-pre-wrap font-sans">{prd.solution}</pre>
                  </div>
                </div>
              )}

              {/* UX 요구사항 */}
              {prd.ux_requirements && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">UX 요구사항</h4>
                  <div className="text-xs bg-background border rounded p-3">
                    <pre className="whitespace-pre-wrap font-sans">{prd.ux_requirements}</pre>
                  </div>
                </div>
              )}

              {/* 엣지 케이스 */}
              {prd.edge_cases && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-primary">엣지 케이스</h4>
                  <div className="text-xs bg-background border rounded p-3">
                    <pre className="whitespace-pre-wrap font-sans">{prd.edge_cases}</pre>
                  </div>
                </div>
              )}

              {/* 빈 상태 */}
              {!prd.background && !prd.problem && !prd.solution && !prd.ux_requirements && !prd.edge_cases && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">PRD 내용이 아직 생성되지 않았습니다.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 우측: 채팅 인터페이스 */}
        <div className="w-1/2 flex flex-col">
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-[85%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">응답 생성 중...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator />

            <div className="p-4">
              <div className="flex space-x-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="PRD에 대한 수정사항이나 질문을 입력하세요..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}