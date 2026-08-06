import type { UploadedFile } from "../types.js";
/**
 * 폼 첨부 업로드.
 *
 * API 모드에서는 콘솔이 **검증과 경로 결정만** 하고 서명 URL 을 발급한다.
 * 파일 자체는 콘솔을 통과하지 않는다 — Vercel 요청 본문 한도(4.5MB)에 걸리고,
 * 콘솔이 대용량 전송을 중계할 이유도 없다.
 *
 * @param formSlug 폼 슬러그. 문서 ID·필드 ID 는 콘솔이 조회해서 정한다.
 */
export declare function uploadFormFiles(formData: FormData): Promise<{
    success: boolean;
    files?: UploadedFile[];
    error?: string;
}>;
export interface UploadTicket {
    name: string;
    contentType: string;
    size: number;
    uploadUrl: string;
    path: string;
}
/**
 * 브라우저가 Storage 로 직접 PUT 할 서명 URL 을 발급받는다.
 *
 * 사이트의 `"use server"` 파일에서 그대로 재수출해 클라이언트에 노출한다.
 * 파일 자체는 **서버를 거치지 않는다** — uploadFormFiles() 와 달리
 * Next 의 Server Action 본문 한도(기본 1MB)에 걸리지 않는다.
 *
 * 검증(형식·크기·개수)과 저장 경로는 콘솔이 정한다. 사이트가 보낸 값은
 * 슬러그와 파일 메타뿐이다.
 */
export declare function issueUploadUrls(formSlug: string, files: {
    name: string;
    contentType: string;
    size: number;
}[], 
/**
 * 첨부 필드 ID. 파일 필드가 둘 이상인 폼(이력서 + 포트폴리오 등)에서 지정한다.
 * 생략하면 콘솔이 첫 번째 파일 필드를 쓴다.
 */
fieldId?: string): Promise<{
    success: true;
    tickets: UploadTicket[];
} | {
    success: false;
    error: string;
}>;
