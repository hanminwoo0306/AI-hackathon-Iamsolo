import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Upload, Image as ImageIcon, Loader2, FileText, MessageSquare, Zap, HelpCircle, Bell } from "lucide-react";
import { PRDDraft } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServiceLaunchModalProps {
  prd: PRDDraft;
  onClose: () => void;
}

interface ServiceLaunch {
  id: string;
  prd_id: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  generated_content?: any;
  status: string;
}

export function ServiceLaunchModal({ prd, onClose }: ServiceLaunchModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serviceLaunch, setServiceLaunch] = useState<ServiceLaunch | null>(null);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  React.useEffect(() => {
    loadServiceLaunch();
  }, [prd.id]);

  const loadServiceLaunch = async () => {
    try {
      const { data, error } = await supabase
        .from('service_launches')
        .select('*')
        .eq('prd_id', prd.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setServiceLaunch(data);
      } else {
        // Create new service launch
        const { data: newLaunch, error: createError } = await supabase
          .from('service_launches')
          .insert({
            prd_id: prd.id,
            status: 'preparing'
          })
          .select()
          .single();

        if (createError) throw createError;
        setServiceLaunch(newLaunch);
      }
    } catch (error) {
      console.error('Error loading service launch:', error);
      toast({
        title: "오류",
        description: "서비스 런칭 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (imageIndex: number, file: File) => {
    if (!serviceLaunch) return;

    setUploadingImage(imageIndex);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceLaunch.id}_image_${imageIndex + 1}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      const updateField = `image_${imageIndex + 1}_url` as keyof ServiceLaunch;
      
      const { error: updateError } = await supabase
        .from('service_launches')
        .update({ [updateField]: publicUrl })
        .eq('id', serviceLaunch.id);

      if (updateError) throw updateError;

      setServiceLaunch(prev => prev ? {
        ...prev,
        [updateField]: publicUrl
      } : null);

      toast({
        title: "이미지 업로드 완료",
        description: `이미지 ${imageIndex + 1}이 성공적으로 업로드되었습니다.`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFileSelect = (imageIndex: number) => {
    const file = fileInputRefs[imageIndex].current?.files?.[0];
    if (file) {
      handleImageUpload(imageIndex, file);
    }
  };

  const generateContent = async (contentType: string) => {
    if (!serviceLaunch) return;

    setGeneratingContent(contentType);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-content-generation', {
        body: {
          prd,
          serviceLaunch,
          contentType
        }
      });

      if (error) throw error;

      if (data.success) {
        await loadServiceLaunch(); // Refresh data
        toast({
          title: "콘텐츠 생성 완료",
          description: `${contentType} 생성이 완료되었습니다.`,
        });
      } else {
        throw new Error(data.error || '콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "생성 실패",
        description: `${contentType} 생성 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(null);
    }
  };

  const getImageUrl = (index: number): string | null => {
    if (!serviceLaunch) return null;
    const key = `image_${index + 1}_url` as keyof ServiceLaunch;
    return serviceLaunch[key] as string || null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-korean flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                서비스 런칭 준비
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {prd.title}에 대한 서비스 런칭 자료를 준비합니다
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 이미지 업로드 영역 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                서비스 화면 이미지 (3개)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const imageUrl = getImageUrl(index);
                  return (
                    <div key={index} className="space-y-2">
                      <Label>이미지 {index + 1}</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        {imageUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={imageUrl} 
                              alt={`서비스 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg mx-auto"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRefs[index].current?.click()}
                              disabled={uploadingImage === index}
                            >
                              {uploadingImage === index ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              변경
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                            <Button
                              variant="outline"
                              onClick={() => fileInputRefs[index].current?.click()}
                              disabled={uploadingImage === index}
                            >
                              {uploadingImage === index ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              업로드
                            </Button>
                          </div>
                        )}
                        <input
                          ref={fileInputRefs[index]}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={() => handleFileSelect(index)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* 자동화 실행 영역 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                콘텐츠 자동 생성
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => generateContent("고객센터 설명자료")}
                  disabled={!!generatingContent}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      고객센터 설명자료 생성
                    </div>
                    <span className="text-xs text-muted-foreground">
                      서비스 이용 안내 자료
                    </span>
                  </div>
                  {generatingContent === "고객센터 설명자료" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => generateContent("FAQ")}
                  disabled={!!generatingContent}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      FAQ 작성
                    </div>
                    <span className="text-xs text-muted-foreground">
                      자주 묻는 질문과 답변
                    </span>
                  </div>
                  {generatingContent === "FAQ" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => generateContent("서비스 소개 콘텐츠")}
                  disabled={!!generatingContent}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      서비스 소개 콘텐츠
                    </div>
                    <span className="text-xs text-muted-foreground">
                      서비스 주요 기능 소개
                    </span>
                  </div>
                  {generatingContent === "서비스 소개 콘텐츠" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => generateContent("알림 메시지")}
                  disabled={!!generatingContent}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      알림 메시지 생성
                    </div>
                    <span className="text-xs text-muted-foreground">
                      푸시 알림 및 인앱 메시지
                    </span>
                  </div>
                  {generatingContent === "알림 메시지" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => generateContent("배너 메시지")}
                  disabled={!!generatingContent}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      배너 메시지 생성
                    </div>
                    <span className="text-xs text-muted-foreground">
                      홍보 배너 및 마케팅 메시지
                    </span>
                  </div>
                  {generatingContent === "배너 메시지" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </Button>
              </div>
            </div>

            {/* 생성된 콘텐츠 미리보기 */}
            {serviceLaunch?.generated_content && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">생성된 콘텐츠</h3>
                  <div className="space-y-4">
                    {Object.entries(serviceLaunch.generated_content).map(([type, content]) => (
                      <Card key={type} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}