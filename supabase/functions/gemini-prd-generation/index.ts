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
    const { task } = await req.json()
    console.log('PRD Generation request for task:', task)

    if (!task) {
      throw new Error('Task information is required')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    // Create the prompt for PRD generation
    const prompt = `
다음 과제에 대한 상세한 PRD(Product Requirements Document)를 한국어로 작성해주세요:

**과제 정보:**
- 제목: ${task.title}
- 설명: ${task.description}
- 우선순위: ${task.priority}
- 개발비용: ${task.development_cost || 'N/A'} MM
- 효과점수: ${task.effect_score || 'N/A'}
- 빈도점수: ${task.frequency_score || 'N/A'}
- 영향점수: ${task.impact_score || 'N/A'}

다음 형식으로 PRD를 작성해주세요:

**배경 (Background):**
- 현재 상황과 문제점을 설명
- 이 기능이 필요한 이유와 맥락

**문제 정의 (Problem):**
- 해결해야 할 구체적인 문제점
- 사용자의 pain point와 니즈

**해결방안 (Solution):**
- 제안하는 기능의 핵심 솔루션
- 어떻게 문제를 해결할 것인지 구체적으로 설명

**UX 요구사항 (UX Requirements):**
- 사용자 경험 관점에서의 요구사항
- 사용자 인터랙션과 UI/UX 가이드라인
- 접근성 및 사용성 고려사항

**엣지 케이스 (Edge Cases):**
- 예외 상황 및 엣지 케이스 처리 방안
- 오류 처리 및 fallback 시나리오
- 성능 및 보안 고려사항

실무진이 바로 개발에 참고할 수 있도록 구체적이고 실용적으로 작성해주세요.
`;

    console.log('Calling Gemini API for PRD generation...')

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
            maxOutputTokens: 4096,
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

    const generatedContent = data.candidates[0].content.parts[0].text

    // Parse the generated content to extract sections
    const sections = {
      background: '',
      problem: '',
      solution: '',
      ux_requirements: '',
      edge_cases: ''
    }

    const lines = generatedContent.split('\n')
    let currentSection = ''
    let currentContent = ''

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine.includes('배경') || trimmedLine.includes('Background')) {
        if (currentSection && currentContent) {
          sections[currentSection as keyof typeof sections] = currentContent.trim()
        }
        currentSection = 'background'
        currentContent = ''
      } else if (trimmedLine.includes('문제') || trimmedLine.includes('Problem')) {
        if (currentSection && currentContent) {
          sections[currentSection as keyof typeof sections] = currentContent.trim()
        }
        currentSection = 'problem'
        currentContent = ''
      } else if (trimmedLine.includes('해결방안') || trimmedLine.includes('Solution')) {
        if (currentSection && currentContent) {
          sections[currentSection as keyof typeof sections] = currentContent.trim()
        }
        currentSection = 'solution'
        currentContent = ''
      } else if (trimmedLine.includes('UX 요구사항') || trimmedLine.includes('UX Requirements')) {
        if (currentSection && currentContent) {
          sections[currentSection as keyof typeof sections] = currentContent.trim()
        }
        currentSection = 'ux_requirements'
        currentContent = ''
      } else if (trimmedLine.includes('엣지 케이스') || trimmedLine.includes('Edge Cases')) {
        if (currentSection && currentContent) {
          sections[currentSection as keyof typeof sections] = currentContent.trim()
        }
        currentSection = 'edge_cases'
        currentContent = ''
      } else if (currentSection && trimmedLine) {
        currentContent += line + '\n'
      }
    }

    // Add the last section
    if (currentSection && currentContent) {
      sections[currentSection as keyof typeof sections] = currentContent.trim()
    }

    console.log('PRD generation completed successfully')

    return new Response(JSON.stringify({
      success: true,
      prd: {
        title: task.title,
        task_id: task.id,
        background: sections.background || generatedContent.substring(0, 1000),
        problem: sections.problem || '',
        solution: sections.solution || '',
        ux_requirements: sections.ux_requirements || '',
        edge_cases: sections.edge_cases || '',
        status: 'draft',
        version: 1
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('PRD Generation Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})