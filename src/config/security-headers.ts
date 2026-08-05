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

  // ── 사이트별 추가 허용 도메인 ──
  // 🎨 지도·결제창·유튜브 등 사이트 고유 외부 리소스를 여기에 넣는다.
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

/** GA4 (gtag.js) */
const GA4_SCRIPT = ["https://www.googletagmanager.com"];
const GA4_CONNECT = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
];
const GA4_IMG = ["https://www.googletagmanager.com", "https://*.google-analytics.com"];

/** 팝업 이미지·첨부 등 Firebase Storage 서빙 도메인 */
const STORAGE_IMG = [
  "https://firebasestorage.googleapis.com",
  "https://*.firebasestorage.app",
  "https://storage.googleapis.com",
];

function directive(name: string, sources: string[]): string {
  return `${name} ${sources.filter(Boolean).join(" ")}`;
}

/** 중복 제거 — 사이트가 이미 들어있는 도메인을 또 넣어도 무해하게 만든다 */
function merge(...groups: (string[] | undefined)[]): string[] {
  return [...new Set(groups.flatMap((g) => g ?? []))];
}

/**
 * CSP 헤더 값만 만든다. 이미 자체 `headers()` 구성이 있는 사이트가
 * CSP 만 가져다 쓸 수 있도록 분리해 둔다.
 */
export function buildCsp(options: SecurityHeadersOptions = {}): string {
  const consoleUrl = (
    options.consoleUrl ??
    process.env.CMS_API_URL ??
    ""
  ).replace(/\/+$/, "");
  const isDev = options.isDev ?? process.env.NODE_ENV === "development";

  if (!consoleUrl) {
    // 조용히 빠지면 챗봇 같은 콘솔 리소스가 브라우저에서 차단되고,
    // 화면에도 로그에도 아무 표시가 없다. 빌드 로그에서만이라도 보이게 한다.
    console.warn(
      "[cms-client] CMS_API_URL 이 없어 CSP 에 콘솔 오리진을 넣지 못했습니다.\n" +
        "             챗봇 등 콘솔에서 불러오는 리소스가 브라우저에서 차단됩니다.\n" +
        "             빌드 환경(Vercel 프로젝트 환경변수)에 CMS_API_URL 을 설정하거나,\n" +
        "             securityHeaders({ consoleUrl: '...' }) 로 직접 넘기세요."
    );
  }

  const consoleOrigin = consoleUrl ? [consoleUrl] : [];

  return [
    directive("default-src", ["'self'"]),
    directive(
      "script-src",
      merge(
        ["'self'", "'unsafe-inline'"],
        GA4_SCRIPT,
        consoleOrigin,
        options.scriptSrc,
        // Next.js 개발 서버는 eval 을 쓴다. 운영에는 넣지 않는다.
        isDev ? ["'unsafe-eval'"] : []
      )
    ),
    directive("style-src", merge(["'self'", "'unsafe-inline'"], options.styleSrc)),
    directive(
      "img-src",
      merge(
        ["'self'", "data:", "blob:"],
        STORAGE_IMG,
        GA4_IMG,
        consoleOrigin,
        options.imgSrc
      )
    ),
    directive("font-src", merge(["'self'", "data:"], options.fontSrc)),
    directive(
      "connect-src",
      merge(
        ["'self'"],
        GA4_CONNECT,
        consoleOrigin,
        options.connectSrc,
        isDev ? ["ws:"] : []
      )
    ),
    directive("frame-src", options.frameSrc?.length ? options.frameSrc : ["'none'"]),
    directive(
      "frame-ancestors",
      options.frameAncestors?.length ? options.frameAncestors : ["'none'"]
    ),
    directive("object-src", ["'none'"]),
    directive("base-uri", ["'self'"]),
    directive("form-action", ["'self'"]),
  ].join("; ");
}

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
export function securityHeaders(
  options: SecurityHeadersOptions = {}
): { key: string; value: string }[] {
  const headers = [
    { key: "X-Frame-Options", value: options.frameOptions ?? "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    // Vercel 도 자체 HSTS 를 붙이지만, 다른 호스팅으로 옮겨도 유지되도록 명시한다.
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ];

  if (options.csp !== false) {
    headers.push({
      key: "Content-Security-Policy",
      value: buildCsp(options),
    });
  }

  return headers;
}
