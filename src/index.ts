/**
 * @designlab-bishu/cms-client
 *
 * 고객사 사이트가 BISHU 클라이언트 콘솔(CMS)에 연결하기 위한 배관 계층.
 * 디자인은 사이트가, 데이터·보안은 이 패키지가 담당한다.
 *
 * ⚠️ 서버 전용이다. 클라이언트 컴포넌트("use client")에서 import 하지 말 것.
 * Server Action 으로 노출하려면 사이트에서 "use server" 파일로 감싼다.
 *
 * 필요한 환경변수:
 *   CUSTOMER_ID                   고객사 ID (콘솔에서 발급)
 *   FIREBASE_SERVICE_ACCOUNT_KEY  서비스 계정 JSON
 */

// ── 조회 ──────────────────────────────────────────────
export { fetchBoards, fetchBoardBySlug, fetchPosts, fetchPost } from "./data/boards.js";
export { fetchFormBySlug } from "./data/forms.js";
export { fetchActivePopups } from "./data/popups.js";
export {
  fetchReservationsByMonth,
  fetchReservationsByDate,
} from "./data/reservations.js";

// ── 쓰기 ──────────────────────────────────────────────
export { createSubmission } from "./actions/submit.js";
export { uploadFormFiles } from "./actions/upload.js";
export { trackPopupEvent, incrementPostViewCount } from "./actions/track.js";

// ── 유틸 ──────────────────────────────────────────────
export { sanitizeCmsHtml } from "./lib/sanitize.js";
export { maskName } from "./lib/mask.js";
export { getCustomerId } from "./lib/config.js";

// ── 타입 ──────────────────────────────────────────────
export type {
  Board,
  BoardViewType,
  Post,
  Form,
  FormField,
  FormFieldType,
  FormFieldOption,
  FormFieldFileConfig,
  Popup,
  PopupEventType,
  Reservation,
  ReservationProduct,
  FileAttachment,
  UploadedFile,
} from "./types.js";
