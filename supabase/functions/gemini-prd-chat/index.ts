import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prd, userMessage, chatHistory } = await req.json()
    console.log('PRD Chat request:', { prdTitle: prd.title, userMessage })

    if (!prd || !userMessage) {
      throw new Error('PRD and user message are required')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    // Build conversation context
    const conversationHistory = chatHistory.map((msg: any) => 
      `${msg.type === 'user' ? '사용자' : 'AI'}: ${msg.content}`
    ).join('\n')

    // Create the prompt for PRD improvement
    const prompt = `
당신은 PRD(Product Requirements Document) 개선을 돕는 전문가입니다.

**현재 PRD 정보:**
제목: ${prd.title}
배경: ${prd.background || '미작성'}
문제 정의: ${prd.problem || '미작성'}
해결방안: ${prd.solution || '미작성'}
UX 요구사항: ${prd.ux_requirements || '미작성'}
엣지 케이스: ${prd.edge_cases || '미작성'}

**이전 대화 내역:**
${conversationHistory}

**사용자 요청:**
${userMessage}

사용자의 요청에 따라 다음 중 하나를 수행해주세요:

1. **질문 응답**: PRD에 대한 질문이라면 상세하고 도움이 되는 답변을 제공
2. **개선 제안**: PRD의 특정 부분을 개선하라는 요청이라면 구체적인 개선안 제시
3. **내용 수정**: 특정 섹션의 수정을 요청했다면 수정된 내용을 제공

응답은 다음 형식 중 하나로 해주세요:

**일반 응답인 경우:**
명확하고 도움이 되는 한국어 응답

**PRD 수정이 필요한 경우:**
수정이 필요한 내용에 대한 설명과 함께, 다음 형식으로 수정된 섹션을 제공:

[UPDATED_SECTION:background]
수정된 배경 내용
[/UPDATED_SECTION]

[UPDATED_SECTION:problem]
수정된 문제 정의 내용
[/UPDATED_SECTION]

[UPDATED_SECTION:solution]
수정된 해결방안 내용
[/UPDATED_SECTION]

[UPDATED_SECTION:ux_requirements]
수정된 UX 요구사항 내용
[/UPDATED_SECTION]

[UPDATED_SECTION:edge_cases]
수정된 엣지 케이스 내용
[/UPDATED_SECTION]

실무진이 바로 활용할 수 있도록 구체적이고 실용적으로 답변해주세요.
`;

    console.log('Calling Gemini API for PRD chat...')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Gemini API response received')
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    const aiResponse = data.candidates[0].content.parts[0].text

    // Check if the response contains PRD updates
    let updatedPRD = null
    const updatedSections: any = {}

    const sectionPattern = /\[UPDATED_SECTION:(\w+)\](.*?)\[\/UPDATED_SECTION\]/gs
    let match
    
    while ((match = sectionPattern.exec(aiResponse)) !== null) {
      const sectionName = match[1]
      const sectionContent = match[2].trim()
      updatedSections[sectionName] = sectionContent
    }

    if (Object.keys(updatedSections).length > 0) {
      updatedPRD = {
        ...prd,
        ...updatedSections,
        updated_at: new Date().toISOString()
      }
    }

    // Clean the response from section markers for display
    const cleanResponse = aiResponse.replace(/\[UPDATED_SECTION:.*?\].*?\[\/UPDATED_SECTION\]/gs, '').trim()

    console.log('PRD chat completed successfully')

    return new Response(JSON.stringify({
      success: true,
      response: cleanResponse || '응답을 생성했습니다.',
      updatedPRD
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('PRD Chat Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      response: '죄송합니다. 응답 생성 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})