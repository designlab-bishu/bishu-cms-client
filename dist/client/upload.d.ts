/**
 * 브라우저 → Storage 직행 업로드
 * @module client/upload
 *
 * 파일이 사이트 서버를 거치지 않는다. Next 의 Server Action 본문 한도(기본 1MB,
 * Vercel 플랫폼 한도 4.5MB)에 걸리지 않으므로 큰 첨부를 받을 수 있다.
 *
 * 흐름:
 *   1. (서버) 콘솔에 서명 URL 을 요청한다 — 검증·경로 결정은 콘솔이 한다
 *   2. (브라우저) 발급받은 URL 로 파일을 직접 PUT 한다
 *   3. 폼 제출에는 Storage 경로만 실어 보낸다
 *
 * ⚠️ 2단계가 동작하려면 **버킷에 CORS 설정**이 있어야 한다. 없으면 브라우저가
 * PUT 을 차단하며, 서버 로그에는 아무것도 남지 않는다.
 */
import type { UploadedFile } from "../types.js";
export interface UploadTicket {
    name: string;
    contentType: string;
    size: number;
    uploadUrl: string;
    path: string;
}
type IssueFn = (formSlug: string, files: {
    name: string;
    contentType: string;
    size: number;
}[], fieldId?: string) => Promise<{
    success: true;
    tickets: UploadTicket[];
} | {
    success: false;
    error: string;
}>;
export interface DirectUploadResult {
    success: boolean;
    files?: UploadedFile[];
    error?: string;
}
/**
 * 선택한 파일을 Storage 로 직접 올린다.
 *
 * @param files    사용자가 고른 File 객체
 * @param formSlug 폼 슬러그. 문서 ID·필드 ID 는 콘솔이 조회해서 정한다
 * @param issue    사이트의 `"use server"` 파일이 재수출한 issueUploadUrls
 * @param onProgress 0~1 진행률. 큰 파일에서 사용자에게 상태를 보여줄 때 쓴다
 * @param fieldId  첨부 필드가 둘 이상인 폼에서 어느 쪽인지 지정
 *
 * ```ts
 * // 사이트: lib/cms-actions.ts
 * "use server";
 * export { issueUploadUrls } from "@designlab-bishu/cms-client";
 *
 * // 사이트: 클라이언트 컴포넌트
 * import { uploadFilesFromBrowser } from "@designlab-bishu/cms-client/client";
 * import { issueUploadUrls } from "@/lib/cms-actions";
 *
 * const r = await uploadFilesFromBrowser(files, "inquiry", issueUploadUrls);
 * ```
 */
export declare function uploadFilesFromBrowser(files: File[], formSlug: string, issue: IssueFn, onProgress?: (ratio: number) => void, fieldId?: string): Promise<DirectUploadResult>;
export {};
