/**
 * 첨부 다운로드 URL
 * @module actions/download
 *
 * 콘솔이 경로 소유권을 검증하고 5분짜리 서명 URL 을 발급한다.
 * 파일은 Storage 에서 직접 내려가므로 콘솔도 사이트도 바이트를 중계하지 않는다.
 */

import { postToConsole, isApiMode } from "../lib/client.js";
import { bucket, getCustomerId } from "../lib/config.js";

/**
 * @returns 서명 URL. 실패 시 null — 호출부가 404 등으로 처리한다.
 */
export async function getAttachmentUrl(path: string): Promise<string | null> {
  if (!isApiMode()) {
    // 레거시: Firebase 직접 접근
    const customerId = getCustomerId();
    const allowed = [`uploads/${customerId}/`, `customers/${customerId}/forms/`];
    if (path.includes("..") || !allowed.some((p) => path.startsWith(p))) {
      return null;
    }
    const file = bucket().file(path);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 5 * 60 * 1000,
    });
    return url;
  }

  const res = await postToConsole<{ url: string }>({
    action: "downloadUrl",
    path,
  });
  return res.ok ? res.data.url : null;
}
