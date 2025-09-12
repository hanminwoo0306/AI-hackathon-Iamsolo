import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RFC4180 compliant CSV parser for handling quotes and commas in data
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

async function readGoogleSheet(spreadsheetUrl: string) {
  try {
    console.log(`Fetching Google Sheet from: ${spreadsheetUrl}`);
    
    // Convert Google Sheets URL to CSV export URL while preserving gid
    let csvUrl = '';
    
    // Extract sheet ID and gid (if present) from various URL formats
    const sheetIdMatch = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('유효하지 않은 Google Spreadsheets URL입니다.');
    }
    
    const sheetId = sheetIdMatch[1];
    
    // Handle different URL formats and preserve gid
    if (spreadsheetUrl.includes('#gid=')) {
      const gidMatch = spreadsheetUrl.match(/gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    } else {
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }
    
    console.log(`Converted CSV URL: ${csvUrl}`);
    
    const response = await fetch(csvUrl);
    
    // Check if request was successful
    if (!response.ok) {
      console.error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
      throw new Error(`Google Sheets에 접근할 수 없습니다. 문서가 공개되어 있는지 확인해주세요. (Status: ${response.status})`);
    }
    
    // Check Content-Type to ensure we got CSV, not HTML
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.error('Received HTML instead of CSV - sheet may be private');
      throw new Error('Google Sheets 문서에 접근할 수 없습니다. 문서가 "링크가 있는 모든 사용자"로 공유되어 있는지 확인해주세요.');
    }
    
    const csvText = await response.text();
    console.log(`CSV data length: ${csvText.length}`);
    
    // Check if we got an HTML error page instead of CSV
    if (csvText.includes('<html') || csvText.includes('<!DOCTYPE')) {
      console.error('Received HTML page instead of CSV data');
      throw new Error('Google Sheets 문서에 접근할 수 없습니다. 문서 공유 설정을 확인해주세요.');
    }
    
    // Parse CSV using RFC4180 compliant parsing
    const feedbackData = [];
    const lines = csvText.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) { // Skip header row
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCSVLine(line);
      if (columns.length >= 2) {
        const date = columns[0]?.trim() || '';
        const feedback = columns[1]?.trim() || '';
        
        if (feedback && feedback.length > 5) { // Minimum feedback length
          feedbackData.push({
            date: date,
            feedback: feedback
          });
        }
      }
    }
    
    console.log(`Parsed feedback data count: ${feedbackData.length}`);
    
    if (feedbackData.length === 0) {
      throw new Error('Google Spreadsheets에서 유효한 피드백 데이터를 찾을 수 없습니다. 2번째 컬럼에 피드백 내용이 있는지 확인해주세요.');
    }
    
    return feedbackData;
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
      return new Response(JSON.stringify({
        success: false,
        error: 'Google Spreadsheets URL이 필요합니다.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GEMINI_API_KEY가 설정되지 않았습니다.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting VOC analysis with Gemini API...');

    // Google Spreadsheets 데이터 읽기
    const feedbackData = await readGoogleSheet(spreadsheetUrl);

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
3. 고객 피드백을 바탕으로 필요한 기능 개선사항을 우선순위 순으로 제안

**중요: 각 기능 개선사항에 대해 다음 메트릭을 평가해주세요:**
- 개발 비용: 1~3 MM (Man Month) - 1이 가장 적은 비용, 3이 가장 많은 비용
- 효과: 낮음(3), 보통(2), 좋음(1) - 숫자가 낮을수록 효과가 높음
- 우선순위 점수: 개발 비용 × 효과 (낮을수록 우선순위 높음)

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
      "development_cost": 1-3,
      "effect_score": 1-3,
      "priority_score": "개발_비용_x_효과_점수",
      "related_feedback_count": 관련_피드백_수,
      "category": "관련_카테고리"
    }
  ]
}

추천 기능은 우선순위 점수(priority_score)가 낮은 순서대로 5개를 제안해주세요.
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
            role: 'user',
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
          // 우선순위 점수 순으로 정렬 (낮은 점수가 높은 우선순위)
          const sortedFeatures = analysisData.recommended_features
            .sort((a, b) => (a.priority_score || 999) - (b.priority_score || 999))
            .slice(0, 5);

          for (let i = 0; i < sortedFeatures.length; i++) {
            const feature = sortedFeatures[i];
            const priorityLevel = i < 2 ? 'high' : i < 4 ? 'medium' : 'low';
            
            await supabase.from('task_candidates').insert({
              title: feature.title || '기능 개선 과제',
              description: `${feature.description || ''}\n\n[분석 메트릭]\n- 개발 비용: ${feature.development_cost || 'N/A'} MM\n- 효과: ${feature.effect_score === 1 ? '좋음' : feature.effect_score === 2 ? '보통' : feature.effect_score === 3 ? '낮음' : 'N/A'}\n- 우선순위 점수: ${feature.priority_score || 'N/A'}\n- 관련 카테고리: ${feature.category || 'N/A'}`,
              source_feedback_id: feedbackSource.id,
              priority: priorityLevel,
              impact_score: feature.development_cost ? (4 - feature.development_cost) * 3 : 5, // 개발비용이 낮을수록 impact 높음
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
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    if (error.message.includes('접근할 수 없습니다') || error.message.includes('공유되어')) {
      statusCode = 403; // Forbidden - access denied
    } else if (error.message.includes('유효하지 않은') || error.message.includes('URL이 필요')) {
      statusCode = 400; // Bad Request - invalid input
    } else if (error.message.includes('데이터를 찾을 수 없습니다')) {
      statusCode = 422; // Unprocessable Entity - valid request but no data
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      hint: error.message.includes('Google Sheets') || error.message.includes('공유') || error.message.includes('접근')
        ? '문서를 "링크가 있는 모든 사용자"로 공개하고, 올바른 시트(gid) 링크를 입력해주세요.'
        : undefined,
      http_status: statusCode
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});