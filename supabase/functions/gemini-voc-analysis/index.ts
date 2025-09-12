import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const { spreadsheetUrl, userPrompt } = await req.json();
    
    if (!spreadsheetUrl) {
      throw new Error('Google Spreadsheets URL이 필요합니다.');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }

    console.log('Starting VOC analysis with Gemini API...');

    // VOC 분석을 위한 프롬프트 구성
    const analysisPrompt = `
다음 Google Spreadsheets URL의 VOC 데이터를 분석해주세요: ${spreadsheetUrl}

분석 요구사항:
1. 고객 피드백의 주요 카테고리 분류
2. 각 카테고리별 빈도수 및 중요도 분석
3. 우선순위가 높은 개선 과제 3-5개 제안
4. 각 과제별 예상 임팩트와 구현 난이도 평가

추가 요청사항: ${userPrompt || '없음'}

분석 결과를 JSON 형태로 구조화하여 제공해주세요.
`;

    // Gemini API 호출
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: analysisPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Gemini API 호출 실패: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API Response received');

    const analysisResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysisResult) {
      throw new Error('Gemini API에서 분석 결과를 받지 못했습니다.');
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // 분석 결과를 데이터베이스에 저장
    const { data: feedbackSource, error: insertError } = await supabase
      .from('feedback_sources')
      .insert({
        name: `VOC 분석 - ${new Date().toLocaleDateString('ko-KR')}`,
        source_url: spreadsheetUrl,
        status: 'analyzed',
        description: '자동 VOC 분석 결과',
        last_analyzed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('분석 결과 저장 중 오류가 발생했습니다.');
    }

    // 분석 결과 저장
    const { error: analysisError } = await supabase
      .from('analysis_results')
      .insert({
        feedback_source_id: feedbackSource.id,
        analysis_type: 'gemini_voc_analysis',
        summary: analysisResult.substring(0, 500), // 요약은 500자로 제한
        result_url: spreadsheetUrl,
      });

    if (analysisError) {
      console.error('Analysis result insert error:', analysisError);
    }

    console.log('VOC analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'VOC 분석이 완료되었습니다.',
      analysis_result: analysisResult,
      feedback_source_id: feedbackSource.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-voc-analysis function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});