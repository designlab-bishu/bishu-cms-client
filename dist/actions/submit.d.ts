/**
 * 폼 제출
 * @module actions/submit
 */
/**
 * 폼 제출.
 *
 * 폼은 **슬러그로 조회**한다. 사이트가 보낸 문서 ID 를 그대로 쓰면 임의 경로에
 * 쓰게 되므로(2026-08-03 studio-bishu 사례), 서버가 조회한 값만 사용한다.
 *
 * 유입 채널 · 기기 종류는 호출부가 넘기지 않는다 — 쿠키에서 알아서 읽어 함께 보낸다 (사이트 코드 수정 없음).
 *
 * 실패 시 예외를 던진다 — 조용히 실패하면 고객 문의가 유실된다.
 */
export declare function createSubmission(formSlug: string, values: Record<string, unknown>, 
/** @deprecated 콘솔이 저장하지 않는다 (FORM-P-154 · API-P-33). 옛 호출 호환용으로만 남긴다 */
meta?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
}): Promise<string>;
