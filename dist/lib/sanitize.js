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
import sanitizeHtml from "sanitize-html";
/** 에디터가 실제로 만들어내는 서식 태그만 허용한다. */
const ALLOWED_TAGS = [
    "p", "br", "span", "div",
    "strong", "b", "em", "i", "u", "s", "mark", "code", "pre", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "sub", "sup",
];
/**
 * CMS 본문 HTML 을 정제한다.
 * - `<script>`·`<iframe>` 등 실행/삽입 태그와 이벤트 핸들러(onclick 등) 제거
 * - `javascript:` 등 실행 가능한 URL 스킴 차단 (http/https/mailto/tel 만 허용)
 * - 새 탭 링크에 rel="noopener noreferrer" 강제 (탭내빙 방지)
 */
export function sanitizeCmsHtml(html) {
    if (!html)
        return "";
    return sanitizeHtml(html, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: {
            "*": ["class", "style"],
            a: ["href", "target", "rel"],
            img: ["src", "alt", "width", "height", "loading"],
            td: ["colspan", "rowspan"],
            th: ["colspan", "rowspan"],
        },
        // data: URI 는 허용하지 않는다 (data:text/html 로 스크립트 실행이 가능하다)
        allowedSchemes: ["http", "https", "mailto", "tel"],
        allowedSchemesAppliedToAttributes: ["href", "src"],
        transformTags: {
            a: (tagName, attribs) => {
                const next = { ...attribs };
                if (next.target === "_blank") {
                    next.rel = "noopener noreferrer";
                }
                return { tagName, attribs: next };
            },
        },
    });
}
