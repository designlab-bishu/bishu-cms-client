/**
 * 폼 제출
 * @module actions/submit
 */
import { postToConsole } from "../lib/client.js";
import { decodeEntry, ENTRY_COOKIE } from "../lib/entry-source.js";
import { decodeDevice, DEVICE_COOKIE } from "../lib/device.js";
/**
 * 방문 첫 진입 경로(v0.14.0 · 콘솔 FORM-P-179 · API-P-36)와
 * 기기 종류(v0.16.0 · FORM-P-183 · API-P-38)를 쿠키에서 읽는다.
 * 쿠키는 `BishuWidgets` 가 적는다. Next 의 요청 범위 밖이거나 쿠키가 없으면 null —
 * 그러면 콘솔이 「알 수 없음」으로 받는다. 채널 · 기기 때문에 제출이 실패하는 일은 없어야 한다.
 */
async function readSubmissionSource() {
    try {
        const { cookies } = await import("next/headers");
        const store = await cookies();
        const entry = decodeEntry(store.get(ENTRY_COOKIE)?.value);
        const device = decodeDevice(store.get(DEVICE_COOKIE)?.value);
        if (!entry && !device)
            return null;
        return { ...(entry ?? {}), ...(device ? { device } : {}) };
    }
    catch {
        return null;
    }
}
/**
 * 제출 실패. `message` 는 `submission_failed:<사유>` — 사유는 콘솔 사유 코드
 * (`consent_required` · `demo_readonly` · `rate_limited` …)이고, 콘솔이 코드를 싣지 않았거나
 * 닿지 못했으면 `http_<상태>` · `network_error` · `config_error` 다 (v0.16.1~. 그 전에는 늘 `http_<상태>` 였다).
 */
export class SubmissionError extends Error {
    reason;
    userMessage;
    constructor(
    /** 사유 코드 */
    reason, 
    /** 콘솔이 실어 보낸 방문자용 문구 — 없을 수 있다 */
    userMessage) {
        super(`submission_failed:${reason}`);
        this.reason = reason;
        this.userMessage = userMessage;
        this.name = "SubmissionError";
    }
}
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
export async function createSubmission(formSlug, values, 
/** @deprecated 콘솔이 저장하지 않는다 (FORM-P-154 · API-P-33). 옛 호출 호환용으로만 남긴다 */
meta) {
    const source = await readSubmissionSource();
    const res = await postToConsole({
        action: "submit",
        formSlug,
        values,
        meta,
        ...(source ? { source } : {}),
    });
    if (!res.ok)
        throw new SubmissionError(res.code ?? res.reason, res.message);
    return res.data.submissionId;
}
