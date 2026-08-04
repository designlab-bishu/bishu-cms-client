/**
 * 첨부 다운로드 URL
 * @module actions/download
 *
 * 콘솔이 경로 소유권을 검증하고 5분짜리 서명 URL 을 발급한다.
 * 파일은 Storage 에서 직접 내려가므로 콘솔도 사이트도 바이트를 중계하지 않는다.
 */
/**
 * @returns 서명 URL. 실패 시 null — 호출부가 404 등으로 처리한다.
 */
export declare function getAttachmentUrl(path: string): Promise<string | null>;
