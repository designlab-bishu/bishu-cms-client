/**
 * @designlab-bishu/cms-client
 *
 * 고객사 사이트가 BISHU 클라이언트 콘솔(CMS)에 연결하기 위한 배관 계층.
 * 디자인은 사이트가, 데이터·보안은 이 패키지가 담당한다.
 *
 * ⚠️ 서버 전용이다. 클라이언트 컴포넌트("use client")에서 import 하지 말 것.
 * Server Action 으로 노출하려면 사이트에서 "use server" 파일로 감싼다.
 *
 * 콘솔 API 로만 통신한다 (v0.10.0~). Firebase 에 직접 접근하지 않으므로
 * 사이트가 서비스 계정 키를 들 이유가 없다 — 키가 새더라도 범위가 해당
 * 고객사로 한정된다.
 *
 * 필요한 환경변수 (셋 다 필수):
 *   CUSTOMER_ID   고객사 ID (콘솔에서 발급)
 *   CMS_API_URL   콘솔 주소 (예: https://admin.example.com)
 *   CMS_API_KEY   고객사 API 키 (콘솔 → 고객사 관리에서 발급)
 *
 * 빠지면 조회는 null 을 돌려주며 에러 로그를 남기고, 제출은 예외를 던진다.
 */
// ── 조회 ──────────────────────────────────────────────
export { fetchBoards, fetchBoardBySlug, fetchPosts, fetchPost } from "./data/boards.js";
export { fetchFormBySlug } from "./data/forms.js";
export { fetchActivePopups } from "./data/popups.js";
export { fetchSiteConfig } from "./data/site-config.js";
export { fetchReservationsByMonth, fetchReservationsByDate, } from "./data/reservations.js";
// ── 쓰기 ──────────────────────────────────────────────
export { createSubmission } from "./actions/submit.js";
export { uploadFormFiles, issueUploadUrls } from "./actions/upload.js";
export { trackPopupEvent, incrementPostViewCount } from "./actions/track.js";
export { getAttachmentUrl } from "./actions/download.js";
// ── 유틸 ──────────────────────────────────────────────
export { sanitizeCmsHtml } from "./lib/sanitize.js";
export { maskName } from "./lib/mask.js";
export { getCustomerId } from "./lib/config.js";
