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

type IssueFn = (
  formSlug: string,
  files: { name: string; contentType: string; size: number }[]
) => Promise<
  { success: true; tickets: UploadTicket[] } | { success: false; error: string }
>;

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
export async function uploadFilesFromBrowser(
  files: File[],
  formSlug: string,
  issue: IssueFn,
  onProgress?: (ratio: number) => void
): Promise<DirectUploadResult> {
  if (files.length === 0) {
    return { success: false, error: "선택된 파일이 없습니다." };
  }

  const issued = await issue(
    formSlug,
    files.map((f) => ({
      name: f.name,
      // OS 가 타입을 모르면 빈 문자열이 온다. 콘솔 화이트리스트가 받는 값으로 맞춘다.
      contentType: f.type || "application/octet-stream",
      size: f.size,
    }))
  );

  if (!issued.success) {
    return { success: false, error: issued.error };
  }

  const uploaded: UploadedFile[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const ticket = issued.tickets[i];
    if (!ticket) {
      return { success: false, error: "파일 업로드에 실패했습니다." };
    }

    let res: Response;
    try {
      res = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": ticket.contentType },
        body: file,
      });
    } catch {
      // 대부분 버킷 CORS 미설정이다. 네트워크 오류와 구분되지 않으므로
      // 사용자에게는 재시도를 안내하고, 원인은 콘솔에서 확인한다.
      return {
        success: false,
        error: "파일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: "파일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    uploaded.push({
      name: ticket.name,
      path: ticket.path,
      size: ticket.size,
      contentType: ticket.contentType,
    });

    onProgress?.((i + 1) / total);
  }

  return { success: true, files: uploaded };
}
