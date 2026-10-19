/**
 * 방문자 기기 종류 → 한 단어 (콘솔 FORM-P-183 · API-P-38 · v0.16.0)
 * @module lib/device
 *
 * 브라우저(`BishuWidgets`)가 판별해 세션 쿠키에 적고, 서버(`createSubmission`)가 그 쿠키를 읽어
 * 유입 채널과 함께 보낸다. 콘솔은 사이트 서버를 거친 요청만 보므로 방문자 기기를 스스로 알 수 없다.
 *
 * 보내는 것은 **`mobile` · `pc` · `tablet` 한 단어**뿐이다. User Agent 원문 · 화면 크기 · 브라우저 이름은
 * 쿠키에도 콘솔에도 남기지 않는다. 판별하지 못하면 아무것도 보내지 않는다.
 *
 * 이 파일은 브라우저 · 서버 양쪽에서 쓴다 — Node 전용 API 를 넣지 말 것.
 */
/** 쿠키 이름 — 세션 쿠키. 값은 기기 한 단어 */
export const DEVICE_COOKIE = "bishu_device";
const DEVICES = ["mobile", "pc", "tablet"];
const TABLET_RE = /iPad|Tablet|PlayBook|Silk|Kindle/i;
const MOBILE_RE = /Mobi|iPhone|iPod|Android/i;
/**
 * 기기 종류를 정한다. 판별할 단서가 없으면 undefined.
 *
 * 1. iPadOS 데스크톱 모드 — UA 가 맥과 같다. `MacIntel` + 터치 2점 이상이면 tablet
 * 2. `userAgentData.mobile` 이 true 면 mobile. false 면 태블릿 단서만 보고 나머지는 pc
 *    (안드로이드 태블릿은 mobile=false 로 온다)
 * 3. UA 문자열 — iPad · 안드로이드 태블릿(Android 인데 Mobile 없음) → tablet, Mobi · iPhone · Android → mobile, 나머지 pc
 */
export function detectDevice(hints) {
    const ua = hints.userAgent ?? "";
    if (hints.platform === "MacIntel" && (hints.maxTouchPoints ?? 0) > 1)
        return "tablet";
    const isTabletUa = TABLET_RE.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    if (typeof hints.uaDataMobile === "boolean") {
        if (hints.uaDataMobile)
            return "mobile";
        if (isTabletUa || /^android$/i.test(hints.uaDataPlatform ?? ""))
            return "tablet";
        return "pc";
    }
    if (!ua)
        return undefined;
    if (isTabletUa)
        return "tablet";
    if (MOBILE_RE.test(ua))
        return "mobile";
    return "pc";
}
/** 지금 브라우저에서 판별한다 — 서버에서 부르면 undefined */
export function detectBrowserDevice() {
    if (typeof navigator === "undefined")
        return undefined;
    const nav = navigator;
    const uaData = nav.userAgentData;
    return detectDevice({
        userAgent: nav.userAgent,
        uaDataMobile: typeof uaData?.mobile === "boolean" ? uaData.mobile : undefined,
        uaDataPlatform: typeof uaData?.platform === "string" ? uaData.platform : undefined,
        platform: nav.platform,
        maxTouchPoints: nav.maxTouchPoints,
    });
}
/** 쿠키 값에서 — 목록 밖은 버린다. 콘솔이 다시 거른다 */
export function decodeDevice(raw) {
    return DEVICES.includes(raw) ? raw : null;
}
