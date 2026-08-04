import type { UploadedFile } from "../types.js";
/**
 * 폼 첨부파일 업로드 Server Action
 *
 * 익명 방문자가 직접 호출할 수 있는 경로이므로 서버에서 전부 재검증한다.
 * 클라이언트 검증(FileFieldInput)은 UX 용도일 뿐 신뢰하지 않는다.
 */
export declare function uploadFormFiles(formData: FormData): Promise<{
    success: boolean;
    files?: UploadedFile[];
    error?: string;
}>;
