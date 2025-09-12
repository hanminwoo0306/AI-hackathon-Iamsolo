import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function readGoogleSheet(spreadsheetUrl: string) {
  try {
    // Google Sheets를 CSV 형태로 읽기 위해 URL 변환
    // https://docs.google.com/spreadsheets/d/{id}/edit -> https://docs.google.com/spreadsheets/d/{id}/export?format=csv
    const sheetId = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (!sheetId) {
      throw new Error('유효하지 않은 Google Spreadsheets URL입니다.');
    }
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    console.log('Fetching Google Sheet from:', csvUrl);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Google Spreadsheets 조회 실패: ${response.status}. 문서가 공개되어 있는지 확인해주세요.`);
    }
    
    const csvText = await response.text();
    console.log('CSV data length:', csvText.length);
    
    // CSV 파싱 (간단한 구현)
    const lines = csvText.split('\n').filter(line => line.trim());
    const data = lines.slice(1).map(line => { // 첫 번째 줄은 헤더이므로 제외
      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
      return {
        date: columns[0] || '',
        feedback: columns[1] || ''
      };
    }).filter(row => row.feedback); // 피드백이 있는 행만 필터링
    
    console.log('Parsed feedback data count:', data.length);
    return data;
  } catch (error) {
    console.error('Google Sheet reading error:', error);
    throw error;
  }
}

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

    // Google Spreadsheets 데이터 읽기
    const feedbackData = await readGoogleSheet(spreadsheetUrl);
    if (feedbackData.length === 0) {
      throw new Error('Google Spreadsheets에서 유효한 피드백 데이터를 찾을 수 없습니다.');
    }

    // 피드백 데이터를 텍스트로 결합
    const feedbackTexts = feedbackData.map((item, index) => 
      `${index + 1}. [${item.date}] ${item.feedback}`
    ).join('\n');

    // VOC 분석을 위한 개선된 프롬프트 구성
    const analysisPrompt = `
다음은 고객들의 피드백 데이터입니다:

${feedbackTexts}

위 고객 피드백을 분석하여 다음 작업을 수행해주세요:

1. 고객 불만사항과 요구사항을 카테고리별로 분류
2. 각 카테고리별 빈도와 중요도 분석
3. 고객 피드백을 바탕으로 필요한 기능 개선사항 5개를 우선순위 순으로 제안

결과는 다음 JSON 형태로 제공해주세요:
{
  "categories": [
    {
      "name": "카테고리명",
      "count": 빈도수,
      "importance": "high/medium/low"
    }
  ],
  "recommended_features": [
    {
      "title": "기능명",
      "description": "기능 설명",
      "priority": "high/medium/low",
      "impact_score": 1-10,
      "implementation_difficulty": "easy/medium/hard",
      "related_feedback_count": 관련_피드백_수
    }
  ]
}

분석 시 실제 고객 피드백 내용을 기반으로 구체적이고 실용적인 개선사항을 제안해주세요.
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

    console.log('Analysis result received, length:', analysisResult.length);

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
        description: `자동 VOC 분석 결과 (${feedbackData.length}개 피드백 분석)`,
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
        source_feedback_id: feedbackSource.id,
        analysis_type: 'gemini_voc_analysis',
        summary: analysisResult.substring(0, 500), // 요약은 500자로 제한
        result_url: spreadsheetUrl,
        metadata: {
          feedback_count: feedbackData.length,
          analysis_timestamp: new Date().toISOString(),
          prompt_used: 'feature_recommendation'
        }
      });

    if (analysisError) {
      console.error('Analysis result insert error:', analysisError);
    }

    // JSON 응답에서 기능 제안사항 추출하여 task_candidates에 저장
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        
        // 추천 기능들을 task_candidates 테이블에 저장
        if (analysisData.recommended_features && Array.isArray(analysisData.recommended_features)) {
          for (const feature of analysisData.recommended_features.slice(0, 5)) {
            await supabase.from('task_candidates').insert({
              title: feature.title || '기능 개선 과제',
              description: feature.description || '',
              source_feedback_id: feedbackSource.id,
              priority: feature.priority || 'medium',
              impact_score: feature.impact_score || 5,
              frequency_score: feature.related_feedback_count || 1,
              status: 'pending'
            });
          }
        }
      }
    } catch (parseError) {
      console.log('JSON parsing failed, but analysis result saved:', parseError);
    }

    console.log('VOC analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: `VOC 분석이 완료되었습니다. ${feedbackData.length}개의 피드백을 분석하여 기능 개선사항을 도출했습니다.`,
      analysis_result: analysisResult,
      feedback_source_id: feedbackSource.id,
      feedback_count: feedbackData.length
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