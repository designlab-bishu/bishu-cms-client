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
