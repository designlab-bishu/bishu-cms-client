/**
 * 콘솔 API 호출 클라이언트 (서버 전용)
 * @module lib/client
 *
 * 고객사 사이트가 Firebase 를 직접 보지 않고 콘솔을 경유하게 하는 통로.
 * 사이트에는 Firebase 서비스 계정 키 대신 고객사 API 키만 있으면 된다.
 *
 * 필요한 환경변수:
 *   CMS_API_URL   콘솔 주소 (예: https://admin.bishu.co.kr)
 *   CMS_API_KEY   고객사 API 키 (콘솔 → 고객사 관리에서 발급)
 *   CUSTOMER_ID   고객사 ID
 */
import { getCustomerId } from "./config.js";
/** 콘솔 응답 대기 상한. 콘솔이 느릴 때 사이트 렌더가 무한정 붙잡히지 않게 한다. */
const REQUEST_TIMEOUT_MS = 8_000;
/** 조회 결과 캐시 시간(초). 콘솔이 잠깐 죽어도 이 시간만큼은 사이트가 버틴다. */
const CACHE_SECONDS = 60;
export class CmsConfigError extends Error {
}
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new CmsConfigError(`[cms-client] ${name} 환경변수가 설정되지 않았습니다.`);
    }
    return value;
}
/** 콘솔 API 를 쓰도록 설정되어 있는지. 미설정이면 Firebase 직접 접근으로 폴백한다. */
export function isApiMode() {
    return !!process.env.CMS_API_URL && !!process.env.CMS_API_KEY;
}
/**
 * 콘솔의 공개 조회 API 를 호출한다.
 *
 * **실패해도 예외를 던지지 않는다.** 콘솔 장애나 네트워크 문제로 페이지 전체가
 * 500 이 되는 것을 막기 위해, 호출부가 빈 결과로 처리할 수 있도록 null 을 반환한다.
 * 설정 오류(환경변수 누락·인증 실패)는 로그로 분명히 남긴다.
 */
export async function fetchFromConsole(params) {
    let baseUrl;
    let apiKey;
    let customerId;
    try {
        baseUrl = requireEnv("CMS_API_URL").replace(/\/+$/, "");
        apiKey = requireEnv("CMS_API_KEY");
        customerId = getCustomerId();
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        return null;
    }
    const query = new URLSearchParams(params).toString();
    const url = `${baseUrl}/api/public/content?${query}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const init = {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "X-Customer-Id": customerId,
            },
            signal: controller.signal,
            // Next.js 데이터 캐시. 콘솔이 잠깐 죽어도 이 시간만큼은 옛 응답으로 버틴다.
            next: { revalidate: CACHE_SECONDS },
        };
        const res = await fetch(url, init);
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error(`[cms-client] 콘솔 응답 오류 ${res.status} (${params.resource}): ${body.slice(0, 200)}`);
            return null;
        }
        return (await res.json());
    }
    catch (err) {
        const reason = err instanceof Error && err.name === "AbortError"
            ? `응답 시간 초과(${REQUEST_TIMEOUT_MS}ms)`
            : err;
        console.error(`[cms-client] 콘솔 호출 실패 (${params.resource}):`, reason);
        return null;
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * 콘솔의 쓰기 API 를 호출한다.
 *
 * 조회와 달리 **실패를 숨기지 않는다.** 폼 제출이 조용히 실패하면 고객 문의가
 * 유실되므로, 호출부가 사용자에게 알릴 수 있도록 null 대신 사유를 돌려준다.
 */
export async function postToConsole(body) {
    let baseUrl;
    let apiKey;
    let customerId;
    try {
        baseUrl = requireEnv("CMS_API_URL").replace(/\/+$/, "");
        apiKey = requireEnv("CMS_API_KEY");
        customerId = getCustomerId();
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        return { ok: false, reason: "config_error" };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(`${baseUrl}/api/public/content`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "X-Customer-Id": customerId,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`[cms-client] 쓰기 실패 ${res.status} (${body.action}): ${text.slice(0, 200)}`);
            return { ok: false, reason: `http_${res.status}` };
        }
        return { ok: true, data: (await res.json()) };
    }
    catch (err) {
        console.error(`[cms-client] 쓰기 호출 실패 (${body.action}):`, err);
        return { ok: false, reason: "network_error" };
    }
    finally {
        clearTimeout(timer);
    }
}
