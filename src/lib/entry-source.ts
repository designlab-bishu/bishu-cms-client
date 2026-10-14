/**
 * 방문 첫 진입 경로 → 유입 채널 (콘솔 FORM-P-179 · API-P-36 · v0.14.0)
 * @module lib/entry-source
 *
 * 브라우저(`BishuWidgets`)가 방문 첫 페이지에서 리퍼러 · UTM 으로 채널을 정해 쿠키에 적고,
 * 서버(`createSubmission`)가 그 쿠키를 읽어 제출과 함께 보낸다. 사이트 폼 코드는 고치지 않는다.
 *
 * 보내는 것은 **채널 하나와 들어온 사이트의 도메인**뿐이다. 전체 URL · 검색어 · UTM 원문은
 * 쿠키에도 콘솔에도 남기지 않는다. 콘솔이 값 목록으로 한 번 더 거른다.
 *
 * 이 파일은 브라우저 · 서버 양쪽에서 쓴다 — Node 전용 API 를 넣지 말 것.
 */

export type EntryChannel =
  | "naver_search"
  | "google_search"
  | "other_search"
  | "sns"
  | "ad"
  | "direct"
  | "other";

export interface EntrySource {
  channel: EntryChannel;
  /** 들어온 사이트의 호스트 (www. 뗌). direct 면 없다 */
  domain?: string;
}

/** 쿠키 이름 — 세션 쿠키(브라우저를 닫으면 사라짐)라 「이번 방문의 첫 진입」이다 */
export const ENTRY_COOKIE = "bishu_entry";

const CHANNELS: EntryChannel[] = [
  "naver_search",
  "google_search",
  "other_search",
  "sns",
  "ad",
  "direct",
  "other",
];

/** 광고로 보는 utm_medium — 소문자 비교 */
const PAID_MEDIUMS = ["cpc", "ppc", "paid", "ad", "ads", "display", "banner", "paidsocial", "paid_social", "sa", "da"];
/** 광고 클릭 표지 (구글 광고 · 네이버 검색광고). fbclid 는 일반 공유 링크에도 붙어 광고로 보지 않는다 */
const PAID_PARAMS = ["gclid", "n_ad", "n_media", "n_keyword_id"];

/** 네이버에서 검색 결과로 보는 호스트 — 통합검색 · 지도 · 플레이스 */
const NAVER_SEARCH_HOSTS = [
  "search.naver.com",
  "m.search.naver.com",
  "map.naver.com",
  "m.map.naver.com",
  "pcmap.place.naver.com",
  "m.place.naver.com",
  "place.naver.com",
];
const OTHER_SEARCH_DOMAINS = [
  "daum.net",
  "bing.com",
  "yahoo.com",
  "duckduckgo.com",
  "zum.com",
  "nate.com",
  "baidu.com",
  "yandex.ru",
  "yandex.com",
  "ecosia.org",
];
/** SNS · 블로그 · 커뮤니티 (네이버 블로그 · 카페 포함) */
const SNS_DOMAINS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "t.co",
  "twitter.com",
  "x.com",
  "threads.net",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "linkedin.com",
  "kakao.com",
  "band.us",
  "blog.naver.com",
  "cafe.naver.com",
  "tistory.com",
  "brunch.co.kr",
];
/** utm_source 가 이 이름이면 SNS 로 본다 (광고가 아닌 경우) */
const SNS_SOURCES = ["instagram", "facebook", "fb", "twitter", "x", "threads", "youtube", "tiktok", "kakao", "kakaotalk", "band", "blog", "naver_blog"];

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/** host 가 domain 이거나 그 하위 도메인인가 */
function isUnder(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function isGoogle(host: string): boolean {
  // google.com · google.co.kr · m.google.com … (googleusercontent 등은 아님)
  return /(^|\.)google\.[a-z.]+$/.test(host);
}

/**
 * 첫 진입의 주소 · 리퍼러로 채널을 정한다.
 * @param pageUrl 첫 페이지 전체 주소 (UTM 을 본다 — 결과에는 남기지 않는다)
 * @param referrer document.referrer (빈 문자열이면 직접)
 */
export function classifyEntry(pageUrl: string, referrer: string): EntrySource {
  let page: URL | null = null;
  try {
    page = new URL(pageUrl);
  } catch {
    page = null;
  }
  let ref: URL | null = null;
  try {
    ref = referrer ? new URL(referrer) : null;
  } catch {
    ref = null;
  }
  const refHost = ref && (ref.protocol === "http:" || ref.protocol === "https:") ? stripWww(ref.hostname) : "";
  const pageHost = page ? stripWww(page.hostname) : "";
  const domain = refHost && refHost !== pageHost ? refHost : undefined;

  // 1) 광고 — UTM medium 이나 광고 클릭 표지
  const params = page?.searchParams;
  const medium = params?.get("utm_medium")?.toLowerCase() ?? "";
  if (PAID_MEDIUMS.includes(medium) || PAID_PARAMS.some((p) => params?.has(p))) {
    return domain ? { channel: "ad", domain } : { channel: "ad" };
  }

  // 2) 리퍼러가 없거나 같은 사이트 — UTM source 로 SNS 만 가려 보고, 아니면 직접
  if (!domain) {
    const source = params?.get("utm_source")?.toLowerCase() ?? "";
    if (source && SNS_SOURCES.includes(source)) return { channel: "sns" };
    if (source || medium) return { channel: "other" };
    return { channel: "direct" };
  }

  // 3) 리퍼러 도메인으로
  if (NAVER_SEARCH_HOSTS.includes(domain)) return { channel: "naver_search", domain };
  if (isGoogle(domain)) return { channel: "google_search", domain };
  if (SNS_DOMAINS.some((d) => isUnder(domain, d))) return { channel: "sns", domain };
  if (OTHER_SEARCH_DOMAINS.some((d) => isUnder(domain, d))) return { channel: "other_search", domain };
  return { channel: "other", domain };
}

/** 쿠키 값으로 — 짧게 · URL 인코딩 */
export function encodeEntry(source: EntrySource): string {
  return encodeURIComponent(JSON.stringify(source.domain ? { c: source.channel, d: source.domain } : { c: source.channel }));
}

/** 쿠키 값에서 — 모양이 틀리면 null. 콘솔이 다시 거르지만 여기서도 목록 밖은 버린다 */
export function decodeEntry(raw: string | undefined): EntrySource | null {
  if (!raw || raw.length > 400) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { c?: unknown; d?: unknown };
    if (!CHANNELS.includes(parsed.c as EntryChannel)) return null;
    const channel = parsed.c as EntryChannel;
    const domain = typeof parsed.d === "string" && /^[a-z0-9.-]{1,253}$/.test(parsed.d) ? parsed.d : undefined;
    return domain ? { channel, domain } : { channel };
  } catch {
    return null;
  }
}
