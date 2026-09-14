/**
 * CMS 데이터 타입
 * @module types
 *
 * 콘솔(bishu-client-console)의 Firestore 스키마를 사이트가 쓰기 좋은 형태로
 * 옮긴 것이다. Firestore Timestamp 는 전부 ISO 문자열로 직렬화된다.
 *
 * 이 타입이 콘솔과 사이트 사이의 계약서다. 콘솔 스키마가 바뀌면 여기가 바뀌고,
 * 사이트는 타입 에러로 즉시 알게 된다.
 */

// ── 공통 ──────────────────────────────────────────────

export interface FileAttachment {
  name: string;
  /** Storage 경로. 다운로드는 프록시 라우트를 경유한다. */
  path?: string;
  /**
   * 공개/토큰 URL.
   * @deprecated 폼 첨부는 2026-08-03 이후 공개 URL 을 발급하지 않는다. `path` 를 쓸 것.
   */
  url?: string;
  size: number;
  contentType?: string;
}

// ── 게시판 ────────────────────────────────────────────

export type BoardViewType = "list" | "card" | "gallery";

export interface Board {
  boardId: string;
  name: string;
  slug: string;
  viewType: BoardViewType;
  categories: string[];
}

export interface Post {
  postId: string;
  title: string;
  category?: string;
  contentType: "markdown" | "html";
  /** HTML. 렌더 전 반드시 sanitizeCmsHtml() 을 거칠 것. */
  content: string;
  isPinned: boolean;
  isNotice: boolean;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
    alt?: string;
  };
  attachments?: FileAttachment[];
  author: {
    displayName: string;
  };
  publishedAt: string | null;
  createdAt: string;
  /** 조회수. incrementPostViewCount() 로 올린 값 */
  viewCount?: number;
}

// ── 폼 ────────────────────────────────────────────────

export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "select"
  | "radio"
  | "checkbox"
  | "file";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldFileConfig {
  maxFiles: number;
  maxSizeMB: number;
  accept: string[];
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  options?: FormFieldOption[];
  file?: FormFieldFileConfig;
}

export interface Form {
  formId: string;
  title: string;
  description?: string;
  slug: string;
  fields: FormField[];
  submit: {
    successMessage: string;
    redirectUrl?: string;
  };
}

/** 업로드 완료된 첨부 정보 */
export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  contentType: string;
}

// ── 팝업 ──────────────────────────────────────────────

export interface Popup {
  popupId: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  link: string;
  linkTarget: "_blank" | "_self";
  startDate: string;
  endDate: string;
  targetPages?: string[];
  /** 표시 디바이스 — 사이트가 UA 로 거른다 (POP-P-91). 둘 다면 전체 */
  devices: ("desktop" | "mobile")[];
  /** 팝업 안 문구 (POP-P-93) — 없으면 이미지만 */
  heading?: string;
  description?: string;
  buttonLabel?: string;
}

/** 「닫기」와 「오늘 하루 보지 않기」는 따로 센다 (POP-P-95) */
export type PopupEventType = "impression" | "click" | "dismiss" | "dismissToday";

// ── 예약 ──────────────────────────────────────────────

export interface Reservation {
  reservationId: string;
  date: string;
  /** "HH:mm" 또는 null(종일) */
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  productName: string;
  productColor: string;
  /** 마스킹된 이름 (예: "홍*동") */
  customerName: string;
  status: "confirmed" | "cancelled";
}

export interface ReservationProduct {
  name: string;
  color: string;
}
