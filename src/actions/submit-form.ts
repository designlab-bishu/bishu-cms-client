/**
 * 폼 제출 공용 함수 — 사이트 폼 값을 콘솔 폼 정의에 맞춰 보낸다 (v0.17.0)
 * @module actions/submit-form
 *
 * 왜 패키지에 두는가 — 사이트마다 콘솔 필드와 짝짓는 방식이 갈려 있었다.
 * order 번호로 짝지은 곳, 「타입별 몇 번째」로 짝지은 곳은 콘솔에서 동의 칸을 추가하거나
 * 순서를 바꾸면 **조용히 다른 칸에 값이 들어간다.** 콘솔 필드 id(`field_<타임스탬프>`)는
 * 순서를 바꿔도 그대로이므로 id 로 짝짓는 것만 안전하다.
 *
 * 하는 일
 * 1. 사이트 값(키 → 값)을 콘솔 필드 id 로 옮긴다 — `fieldMap` 이 없으면 키가 곧 필드 id
 * 2. 동의(consent) 칸을 채운다 — 방문자가 체크했을 때만. 체크하지 않았으면 콘솔을 부르지 않고 거부
 * 3. 짝이 끊긴 칸 · 비어 있는 필수 칸을 서버 로그에 남긴다 (키 이름만 — 값은 남기지 않는다)
 * 4. 거부 사유를 방문자가 읽을 문구로 돌려준다
 *
 * 유입 채널 · 기기는 `createSubmission` 이 쿠키에서 읽어 함께 보낸다 (기존과 같다).
 * 이 함수는 **예외를 던지지 않는다** — 실패는 `{ ok: false, message }` 로 돌려준다. 호출부는 그 문구를 보인다.
 */

import { fetchFormBySlug } from "../data/forms.js";
import type { Form } from "../types.js";
import { createSubmission, SubmissionError } from "./submit.js";

export type FormSubmitResult =
  | { ok: true; submissionId: string }
  | {
      ok: false;
      /** 사유 코드 — 콘솔 사유(`consent_required` · `demo_readonly` · `rate_limited` …) 또는 `form_not_found` · `network_error` · `http_<상태>` */
      reason: string;
      /** 방문자에게 그대로 보여줄 문구 */
      message: string;
    };

export interface SubmitCmsFormOptions {
  /**
   * 사이트 키 → 콘솔 필드 id. 예: `{ companyName: "field_1723456789012" }`.
   * 주면 **여기 적힌 키만** 보낸다. 생략하면 `values` 의 키를 콘솔 필드 id 로 본다
   * (콘솔 정의로 폼을 그리는 템플릿 방식).
   */
  fieldMap?: Record<string, string>;
  /** 방문자가 개인정보 동의에 체크했는가. 폼에 동의 칸이 있으면 이 값이 `true` 일 때만 채운다 */
  consent?: boolean;
  /** 이미 조회한 폼 정의. 생략하면 슬러그로 조회한다 */
  form?: Form;
  /** 사유 코드별 문구 덮어쓰기. 예: `{ demo_readonly: "샘플 사이트라 접수되지 않습니다." }` */
  messages?: Record<string, string>;
}

const DEFAULT_MESSAGE = "제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 콘솔이 문구를 싣지 않는 사유 · 콘솔에 닿기 전의 사유 */
const DEFAULT_MESSAGES: Record<string, string> = {
  consent_required: "개인정보 수집·이용에 동의해 주세요.",
  demo_readonly: "데모에서는 접수되지 않습니다.",
  rate_limited: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  form_not_found: "지금은 접수할 수 없습니다. 잠시 후 다시 시도해 주세요.",
};

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function fail(
  reason: string,
  options: SubmitCmsFormOptions,
  consoleMessage?: string
): FormSubmitResult {
  return {
    ok: false,
    reason,
    message: options.messages?.[reason] ?? consoleMessage ?? DEFAULT_MESSAGES[reason] ?? DEFAULT_MESSAGE,
  };
}

/**
 * 사이트 폼 값을 콘솔 폼 정의에 맞춰 제출한다.
 *
 * ```ts
 * // 사이트의 "use server" 파일
 * import { submitCmsForm } from "@designlab-bishu/cms-client";
 *
 * export async function submitInquiry(data: InquiryData, agreed: boolean) {
 *   return submitCmsForm("inquiry", data, {
 *     fieldMap: { name: "field_1723456789012", email: "field_1723456789013" },
 *     consent: agreed,
 *   });
 * }
 * ```
 */
export async function submitCmsForm(
  formSlug: string,
  values: Record<string, unknown>,
  options: SubmitCmsFormOptions = {}
): Promise<FormSubmitResult> {
  const tag = `[cms-client] submitCmsForm(${formSlug})`;

  const form = options.form ?? (await fetchFormBySlug(formSlug));
  if (!form) {
    console.error(`${tag} 폼 정의를 찾지 못했습니다 — 슬러그 · 폼 활성 상태를 확인하세요.`);
    return fail("form_not_found", options);
  }

  const fieldIds = new Set(form.fields.map((f) => f.id));
  const pairs: [siteKey: string, fieldId: string][] = options.fieldMap
    ? Object.entries(options.fieldMap)
    : Object.keys(values).map((key) => [key, key]);

  const mapped: Record<string, unknown> = {};
  const unmatched: string[] = [];
  for (const [siteKey, fieldId] of pairs) {
    if (!fieldIds.has(fieldId)) {
      unmatched.push(siteKey === fieldId ? siteKey : `${siteKey} → ${fieldId}`);
      continue;
    }
    const value = values[siteKey];
    if (!isEmpty(value)) mapped[fieldId] = value;
  }

  const emptyRequired: string[] = [];
  for (const field of form.fields) {
    if (field.type === "consent") {
      // 동의는 방문자가 체크한 것만 — 사이트가 대신 만들어 넣지 않는다
      if (options.consent === true || mapped[field.id] === true) {
        mapped[field.id] = true;
        continue;
      }
      console.warn(`${tag} 동의 칸(${field.id})이 체크되지 않아 제출하지 않았습니다.`);
      return fail("consent_required", options);
    }
    if (field.required && isEmpty(mapped[field.id])) {
      emptyRequired.push(`${field.label} (${field.id})`);
    }
  }

  // 콘솔은 어긋나도 저장한다 (경고만) — 여기서는 사이트 쪽 짝이 끊긴 것을 로그로 드러낸다
  if (unmatched.length > 0) {
    console.warn(`${tag} 콘솔 정의에 없는 필드라 보내지 않았습니다: ${unmatched.join(", ")}`);
  }
  if (emptyRequired.length > 0) {
    console.warn(`${tag} 필수 칸이 비어 있습니다: ${emptyRequired.join(", ")}`);
  }

  try {
    const submissionId = await createSubmission(formSlug, mapped);
    return { ok: true, submissionId };
  } catch (err) {
    if (err instanceof SubmissionError) return fail(err.reason, options, err.userMessage);
    console.error(`${tag} 제출 실패:`, err);
    return fail("unknown_error", options);
  }
}
