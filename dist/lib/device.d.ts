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
/** 콘솔 analytics 의 기기 키와 같다 */
export type DeviceKind = "mobile" | "pc" | "tablet";
/** 쿠키 이름 — 세션 쿠키. 값은 기기 한 단어 */
export declare const DEVICE_COOKIE = "bishu_device";
/** 판별에 쓰는 브라우저 값 — 결과에는 남기지 않는다 */
export interface DeviceHints {
    /** navigator.userAgent */
    userAgent?: string;
    /** navigator.userAgentData?.mobile (Chromium 계열만 있다) */
    uaDataMobile?: boolean;
    /** navigator.userAgentData?.platform */
    uaDataPlatform?: string;
    /** navigator.platform — iPadOS 데스크톱 모드 판별용 */
    platform?: string;
    /** navigator.maxTouchPoints */
    maxTouchPoints?: number;
}
/**
 * 기기 종류를 정한다. 판별할 단서가 없으면 undefined.
 *
 * 1. iPadOS 데스크톱 모드 — UA 가 맥과 같다. `MacIntel` + 터치 2점 이상이면 tablet
 * 2. `userAgentData.mobile` 이 true 면 mobile. false 면 태블릿 단서만 보고 나머지는 pc
 *    (안드로이드 태블릿은 mobile=false 로 온다)
 * 3. UA 문자열 — iPad · 안드로이드 태블릿(Android 인데 Mobile 없음) → tablet, Mobi · iPhone · Android → mobile, 나머지 pc
 */
export declare function detectDevice(hints: DeviceHints): DeviceKind | undefined;
/** 지금 브라우저에서 판별한다 — 서버에서 부르면 undefined */
export declare function detectBrowserDevice(): DeviceKind | undefined;
/** 쿠키 값에서 — 목록 밖은 버린다. 콘솔이 다시 거른다 */
export declare function decodeDevice(raw: string | undefined): DeviceKind | null;
