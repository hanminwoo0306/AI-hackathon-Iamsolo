import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Save, RefreshCw } from "lucide-react";
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
    <Card className="glass-card h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-korean">PRD 개선 채팅</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{prd.title}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{prd.status}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePRD}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              저장
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="text-sm whitespace-pre-wrap text-korean">
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
                <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">응답 생성 중...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="PRD에 대한 수정사항이나 질문을 입력하세요..."
              className="flex-1 min-h-[60px] resize-none text-korean"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-gradient"
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
    </Card>
  );
}