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
export type EntryChannel = "naver_search" | "google_search" | "other_search" | "sns" | "ad" | "direct" | "other";
export interface EntrySource {
    channel: EntryChannel;
    /** 들어온 사이트의 호스트 (www. 뗌). direct 면 없다 */
    domain?: string;
}
/** 쿠키 이름 — 세션 쿠키(브라우저를 닫으면 사라짐)라 「이번 방문의 첫 진입」이다 */
export declare const ENTRY_COOKIE = "bishu_entry";
/**
 * 첫 진입의 주소 · 리퍼러로 채널을 정한다.
 * @param pageUrl 첫 페이지 전체 주소 (UTM 을 본다 — 결과에는 남기지 않는다)
 * @param referrer document.referrer (빈 문자열이면 직접)
 */
export declare function classifyEntry(pageUrl: string, referrer: string): EntrySource;
/** 쿠키 값으로 — 짧게 · URL 인코딩 */
export declare function encodeEntry(source: EntrySource): string;
/** 쿠키 값에서 — 모양이 틀리면 null. 콘솔이 다시 거르지만 여기서도 목록 밖은 버린다 */
export declare function decodeEntry(raw: string | undefined): EntrySource | null;
