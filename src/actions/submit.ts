/**
 * 폼 제출
 * @module actions/submit
 */

import { getCustomerId } from "../lib/config.js";
import { postToConsole } from "../lib/client.js";
import { decodeEntry, ENTRY_COOKIE, type EntrySource } from "../lib/entry-source.js";

/**
 * 방문 첫 진입 경로를 쿠키에서 읽는다 (v0.14.0 · 콘솔 FORM-P-179 · API-P-36).
 * 쿠키는 `BishuWidgets` 가 적는다. Next 의 요청 범위 밖이거나 쿠키가 없으면 null —
 * 그러면 콘솔이 「알 수 없음」으로 받는다. 채널 때문에 제출이 실패하는 일은 없어야 한다.
 */
async function readEntrySource(): Promise<EntrySource | null> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return decodeEntry(store.get(ENTRY_COOKIE)?.value);
  } catch {
    return null;
  }
}

/**
 * 폼 제출.
 *
 * 폼은 **슬러그로 조회**한다. 사이트가 보낸 문서 ID 를 그대로 쓰면 임의 경로에
 * 쓰게 되므로(2026-08-03 studio-bishu 사례), 서버가 조회한 값만 사용한다.
 *
 * 유입 채널은 호출부가 넘기지 않는다 — 쿠키에서 알아서 읽어 함께 보낸다 (사이트 코드 수정 없음).
 *
 * 실패 시 예외를 던진다 — 조용히 실패하면 고객 문의가 유실된다.
 */
export async function createSubmission(
  formSlug: string,
  values: Record<string, unknown>,
  /** @deprecated 콘솔이 저장하지 않는다 (FORM-P-154 · API-P-33). 옛 호출 호환용으로만 남긴다 */
  meta?: { pageUrl?: string; referrer?: string; userAgent?: string }
): Promise<string> {
  const source = await readEntrySource();

  const res = await postToConsole<{ submissionId: string }>({
    action: "submit",
    formSlug,
    values,
    meta,
    ...(source ? { source } : {}),
  });
  if (!res.ok) throw new Error(`submission_failed:${res.reason}`);
  return res.data.submissionId;
}
