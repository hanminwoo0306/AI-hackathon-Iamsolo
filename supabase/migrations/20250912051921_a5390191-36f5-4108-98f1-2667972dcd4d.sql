-- 1) 스키마 가드: user_id 기본값 설정
ALTER TABLE prd_drafts 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 기존 RLS 정책 제거
DROP POLICY IF EXISTS "Allow all operations on prd_drafts" ON prd_drafts;

-- 2) RLS 정책 추가: 사용자별 접근 제어
-- INSERT: 본인 소유 행만 생성 허용
CREATE POLICY "prd_drafts.insert.own"
ON prd_drafts
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- SELECT: 본인 소유 행만 조회
CREATE POLICY "prd_drafts.select.own"
ON prd_drafts
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- UPDATE: 본인 소유 행만 수정
CREATE POLICY "prd_drafts.update.own"
ON prd_drafts
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- DELETE: 본인 소유 행만 삭제
CREATE POLICY "prd_drafts.delete.own"
ON prd_drafts
FOR DELETE
TO authenticated
USING (created_by = auth.uid());