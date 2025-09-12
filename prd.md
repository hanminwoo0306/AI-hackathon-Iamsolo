# PM 업무 자동화 서비스 PRD

## 🎯 문제 & 미션

### 문제점
- VOC 데이터 수집·분석에 과도한 시간 소요
- PRD 및 관련 문서 작성에 반복 업무 많음
- 팀 간 커뮤니케이션 자료 생성이 단편적이고 일관성 부족

### 미션
- VOC → 과제 → PRD → 고객 커뮤니케이션까지 한 번에 자동 생성
- 팀 전체가 활용 가능한 문서 기반 자동화를 제공
- PM의 기획 품질과 속도를 동시에 높이기

## 🎯 대상 사용자 (Target Audience)

### 1차 사용자: PM, PO
피드백 기반 기획 및 문서 업무 전반을 자동화

### 2차 사용자: CS팀, 마케팅팀
- 설명자료, 공지 콘텐츠, FAQ 등 자동 생성물 활용

## 🧩 핵심 기능 (Core Features)

### VOC 수집·분석 자동화
- Google Spreadsheets 설문결과에서 피드백 통합 수집
- 감성 분석 및 카테고리 분류 (버그, 요청 등)

### 과제 도출 + PRD 초안 생성
- AI가 주요 VOC 테마 기반 과제 제안
- 선택 시 PRD 초안 자동 생성 (템플릿 기반)

### 고객 커뮤니케이션 콘텐츠 자동 생성
- 서비스 소개 콘텐츠 (공지/블로그용)
- 고객센터 설명 자료 (내부용 Q&A 요약)
- FAQ 문서 (사용자 질문 추론 + 답변 생성)
- 알림 메시지 (제품 내 팝업/문자/카카오톡알림메시지)
- 배너 문구 (단문 광고 카피)

### 외부 연동
- **Slack 연동**: 요약 요청, PRD 초안 호출, 주요 이슈 알림 등
- **Google Spreadsheet 연동**: VOC 대시보드, 우선순위 산정용 시트, 피드백 수정 가능
- **Confluence 연동**: PRD 및 FAQ, 설명자료 자동 게시

## 📐 데이터 구조 (ERD in words)

### Feedback
- id, text, channel, date, sentiment, tag (bug/request/etc)

### TaskCandidate
- id, title, linked_feedback_ids, frequency_score, impact_score

### PRDDraft
- id, task_id, background, problem, solution, UX, edge_cases

### ContentAssets
- id, task_id, type (faq, banner, etc), content, status

### User
- id, name, role (PM, CS, Marketing), permissions

## 🎨 UI/UX 원칙
- **한눈에 보이게**: 주요 피드백·과제·문서를 카드 형태로 구성
- **3클릭 이내 워크플로우**: VOC → 과제 선택 → 자동 생성
- **문서 기반 협업 최적화**: PRD·FAQ는 Confluence 자동 업로드
- **Slack 중심 흐름**: 명령어 호출 및 알림 기반 PM 업무 설계

## 🔐 보안 & 컴플라이언스
- 사내용 데이터만 분석, 외부 학습 불가
- 인증: OAuth (Slack, Google)
- 문서 전송 시 TLS 암호화 및 로그 기록
- 내부 문서 필터링 및 권한 기반 문서 노출

## 🗺️ 로드맵 (MVP → V1 → V2)

### ✅ MVP
- VOC 수집·분석 및 요약 (Google Sheets + Slack)
- PRD 초안 생성 (사내 템플릿 기반)
- 고객 콘텐츠 5종 자동 생성 (소개, 설명자료, FAQ, 알림, 배너)
- Slack / Google Sheets 연동

### 🛠️ V1
- 과제 우선순위 산정 자동화 (RICE 기반)
- Confluence 연동 (PRD·문서 자동 게시)
- 알림 A/B 테스트, 문구 추천 기능 추가

### 🚀 V2
- JIRA 자동 이슈 생성
- 사용성 분석 기반 콘텐츠 추천 개선
- 역할별 맞춤 대시보드 (PM / CS / Marketing)

## ⚠️ 주요 리스크 & 대응

| 리스크 | 대응 방안 |
|--------|-----------|
| 콘텐츠 품질 저하 | 승인 프로세스 + AI 리뷰기 도입 |
| PRD 누락 | 템플릿 기반 필수 필드 적용 |
| 채널 연동 실패 | 수동 fallback (다운로드 or 이메일 전송) |
| 과도한 API 호출 비용 | 캐싱, 배치 처리, 트리거형 생성으로 비용 제어 |

## 🌱 확장 가능성
- VOC → 출시 후 사용자 만족도 측정 리포트까지 확장
- AI 기반 이슈 트렌드 예측 (ex. 기능 요청 급증 탐지)
- PRD 작성 외 PM 업무 전반 (ex. 회의록, 경쟁 분석 등) 자동화