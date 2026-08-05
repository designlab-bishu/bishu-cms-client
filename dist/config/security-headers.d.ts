/**
 * 고객사 사이트 공통 보안 헤더
 * @module config/security-headers
 *
 * `next.config.ts` 의 `headers()` 에서 쓴다. **빌드 시점에 평가되며**
 * 요청마다 실행되지 않는다.
 *
 * 왜 패키지에 두는가 — CSP 는 "여기서 오는 코드만 실행하라"는 브라우저 명단이고,
 * CMS 기능을 붙일 때마다 항목이 늘어난다. 사이트마다 손으로 관리하면
 * **한 곳만 빠뜨려도 그 사이트에서만 기능이 조용히 죽는다**
 * (2026-08-05 studio-bishu: 챗봇을 켰으나 CSP 에 콘솔이 없어 차단됨).
 * 여기 모아두면 패키지 버전만 올려도 전 고객사가 함께 갱신된다.
 */
export interface SecurityHeadersOptions {
    /**
     * CMS 콘솔 오리진. 챗봇 스크립트를 내려받고 위젯이 API 를 호출하는 곳.
     * 생략 시 `CMS_API_URL` 환경변수를 쓴다.
     */
    consoleUrl?: string;
    /** 개발 모드 여부. 생략 시 `NODE_ENV === "development"` */
    isDev?: boolean;
    /** iframe 삽입 허용 범위. 기본 `"DENY"` */
    frameOptions?: "DENY" | "SAMEORIGIN";
    /** CSP 를 아예 내보내지 않는다. 문제 격리용이며 운영에서는 쓰지 말 것 */
    csp?: false;
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    fontSrc?: string[];
    connectSrc?: string[];
    /** 기본값은 `'none'` 이다. 임베드가 필요하면 도메인을 넣는다 */
    frameSrc?: string[];
    /**
     * 이 사이트를 iframe 으로 감쌀 수 있는 곳. 기본값 `'none'`.
     * X-Frame-Options 의 현대식 대체재이며 더 정밀하다.
     */
    frameAncestors?: string[];
}
/**
 * CSP 헤더 값만 만든다. 이미 자체 `headers()` 구성이 있는 사이트가
 * CSP 만 가져다 쓸 수 있도록 분리해 둔다.
 */
export declare function buildCsp(options?: SecurityHeadersOptions): string;
/**
 * Next.js `headers()` 에 그대로 넣을 수 있는 보안 헤더 배열.
 *
 * ```ts
 * // next.config.ts
 * import { securityHeaders } from "@designlab-bishu/cms-client/config";
 *
 * const nextConfig: NextConfig = {
 *   async headers() {
 *     return [{ source: "/:path*", headers: securityHeaders() }];
 *   },
 * };
 * ```
 */
export declare function securityHeaders(options?: SecurityHeadersOptions): {
    key: string;
    value: string;
}[];
