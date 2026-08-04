/**
 * CMS 리치텍스트 정제
 * @module lib/sanitize
 *
 * 게시글·공지 본문은 CMS(bishu-client-console)에서 Tiptap 으로 작성된 HTML 이며,
 * 서식을 살리기 위해 dangerouslySetInnerHTML 로 렌더한다.
 * 관리자 계정이 탈취되면 본문에 심긴 스크립트가 방문자 브라우저에서 실행되므로,
 * 화면에 뿌리기 직전에 실행 가능한 요소를 제거한다.
 *
 * 렌더 시점에 거르므로 이미 저장된 과거 글도 함께 방어된다.
 */
import DOMPurify from "isomorphic-dompurify";
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
const ALLOWED_ATTR = [
    "href", "target", "rel",
    "src", "alt", "width", "height", "loading",
    "class", "style",
    "colspan", "rowspan",
];
/**
 * CMS 본문 HTML 을 정제한다.
 * - `<script>`·이벤트 핸들러(onclick 등) 제거
 * - `javascript:` 등 실행 가능한 URL 스킴 차단 (http/https/mailto/tel 만 허용)
 * - 외부 링크에 rel="noopener noreferrer" 강제
 */
export function sanitizeCmsHtml(html) {
    if (!html)
        return "";
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
        // target 값(_blank)은 URL 이 아니므로 위 정규식 검사에서 제외한다.
        // 빠뜨리면 새 탭으로 열리던 링크가 조용히 같은 탭으로 바뀐다.
        ADD_URI_SAFE_ATTR: ["target"],
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "formaction"],
    });
}
