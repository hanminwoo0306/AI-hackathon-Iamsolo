import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prd, serviceLaunch, contentType } = await req.json();
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Content generation request for type: ${contentType}`);
    console.log('PRD:', prd);
    console.log('Service Launch:', serviceLaunch);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // 콘텐츠 타입별 프롬프트 생성
    let systemPrompt = '';
    let userPrompt = '';

    switch (contentType) {
      case 'FAQ':
        systemPrompt = `당신은 카카오페이 FAQ 스타일의 콘텐츠를 작성하는 전문가입니다. 
카카오페이 FAQ 구조를 참고하여 다음과 같은 형식으로 작성해주세요:
- 카테고리별로 분류
- 간단명료한 질문
- 친근하고 이해하기 쉬운 답변
- 단계별 설명 포함
- 관련 링크나 추가 정보 제공

카카오페이 FAQ 예시 참고: https://support.kakaopay.com/web/faq-list/all`;
        break;
        
      case '서비스 소개 콘텐츠':
        systemPrompt = `당신은 서비스 소개 콘텐츠를 작성하는 마케팅 전문가입니다.
카카오페이 증권의 "서비스 소개" 콘텐츠 스타일을 참고하여 다음과 같은 요소를 포함해주세요:
- 서비스의 핵심 가치 제안
- 주요 기능과 혜택
- 사용자에게 주는 가치
- 차별화된 특징
- 친근하고 신뢰감 있는 톤앤매너

참고 콘텐츠: https://content.kakaopaysec.com/details/68789ab43c089e62009e2fe1`;
        break;
        
      case '고객센터 설명자료':
        systemPrompt = `당신은 고객센터 직원들이 사용할 서비스 설명 자료를 작성하는 전문가입니다.
다음 요소들을 포함해주세요:
- 서비스 개요
- 주요 기능 설명
- 사용 방법 가이드
- 자주 발생하는 문제와 해결방법
- 고객 응대 시 유의사항`;
        break;
        
      case '알림 메시지':
        systemPrompt = `당신은 사용자에게 전달할 알림 메시지를 작성하는 UX 라이터입니다.
다음과 같은 알림 메시지들을 작성해주세요:
- 신규 기능 출시 알림
- 업데이트 안내
- 이벤트 알림
- 시스템 점검 안내
- 중요 공지사항
각 메시지는 간결하고 액션을 유도하는 형태로 작성해주세요.`;
        break;
        
      case '배너 메시지':
        systemPrompt = `당신은 마케팅 배너 메시지를 작성하는 카피라이터입니다.
다음과 같은 배너 메시지들을 작성해주세요:
- 메인 홍보 배너 (헤드라인 + 서브카피)
- 기능별 프로모션 배너
- 이벤트 배너
- CTA(Call to Action) 문구
각 배너는 임팩트 있고 기억에 남는 카피로 작성해주세요.`;
        break;
        
      default:
        systemPrompt = `당신은 ${contentType} 콘텐츠를 작성하는 전문가입니다.`;
    }

    userPrompt = `다음 PRD 정보를 바탕으로 ${contentType}를 작성해주세요:

PRD 제목: ${prd.title}
배경: ${prd.background || ''}
문제: ${prd.problem || ''}
솔루션: ${prd.solution || ''}
UX 요구사항: ${prd.ux_requirements || ''}
엣지 케이스: ${prd.edge_cases || ''}

${serviceLaunch.image_1_url ? `서비스 이미지 1: ${serviceLaunch.image_1_url}` : ''}
${serviceLaunch.image_2_url ? `서비스 이미지 2: ${serviceLaunch.image_2_url}` : ''}
${serviceLaunch.image_3_url ? `서비스 이미지 3: ${serviceLaunch.image_3_url}` : ''}

위 정보를 종합하여 실제 서비스에서 사용 가능한 고품질의 ${contentType}를 작성해주세요.
한국어로 작성하고, 실무에서 바로 활용할 수 있는 수준으로 상세하게 작성해주세요.`;

    console.log('Calling Gemini API for content generation...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedContent = data.candidates[0].content.parts[0].text;

    // 기존 generated_content에 새로운 콘텐츠 추가
    const currentContent = serviceLaunch.generated_content || {};
    const updatedContent = {
      ...currentContent,
      [contentType]: generatedContent
    };

    console.log(`Saving ${contentType} content to database`);

    // 데이터베이스 업데이트
    const { error: updateError } = await supabase
      .from('service_launches')
      .update({
        generated_content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceLaunch.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`${contentType} content saved successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        contentType,
        content: generatedContent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Content generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});