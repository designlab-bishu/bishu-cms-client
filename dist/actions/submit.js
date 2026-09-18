/**
 * 폼 제출
 * @module actions/submit
 */
import { postToConsole } from "../lib/client.js";
/**
 * 폼 제출.
 *
 * 폼은 **슬러그로 조회**한다. 사이트가 보낸 문서 ID 를 그대로 쓰면 임의 경로에
 * 쓰게 되므로(2026-08-03 studio-bishu 사례), 서버가 조회한 값만 사용한다.
 *
 * 실패 시 예외를 던진다 — 조용히 실패하면 고객 문의가 유실된다.
 */
export async function createSubmission(formSlug, values, 
/** @deprecated 콘솔이 저장하지 않는다 (FORM-P-154 · API-P-33). 옛 호출 호환용으로만 남긴다 */
meta) {
    const res = await postToConsole({
        action: "submit",
        formSlug,
        values,
        meta,
    });
    if (!res.ok)
        throw new Error(`submission_failed:${res.reason}`);
    return res.data.submissionId;
}
