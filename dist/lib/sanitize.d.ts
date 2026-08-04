/**
 * CMS 리치텍스트 정제
 * @module lib/sanitize
 *
 * 게시글·공지 본문은 콘솔에서 Tiptap 으로 작성된 HTML 이며, 서식을 살리려면
 * dangerouslySetInnerHTML 로 렌더해야 한다. 관리자 계정이 탈취되면 본문에 심긴
 * 스크립트가 방문자 브라우저에서 실행되므로, 화면에 뿌리기 직전에 거른다.
 *
 * 렌더 시점에 거르므로 이미 저장된 과거 글도 함께 방어된다.
 *
 * ⚠️ isomorphic-dompurify 를 쓰지 않는다. jsdom 을 끌고 오는데 Vercel
 *    서버리스 런타임에서 ERR_REQUIRE_ESM 으로 로드에 실패한다(빌드는 통과하고
 *    런타임에만 500 이 나서 발견이 늦다). sanitize-html 은 htmlparser2 기반이라
 *    DOM 구현이 필요 없다.
 */
/**
 * CMS 본문 HTML 을 정제한다.
 * - `<script>`·`<iframe>` 등 실행/삽입 태그와 이벤트 핸들러(onclick 등) 제거
 * - `javascript:` 등 실행 가능한 URL 스킴 차단 (http/https/mailto/tel 만 허용)
 * - 새 탭 링크에 rel="noopener noreferrer" 강제 (탭내빙 방지)
 */
export declare function sanitizeCmsHtml(html: string | undefined | null): string;
