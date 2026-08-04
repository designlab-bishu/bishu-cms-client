/**
 * 폼 데이터 서버사이드 읽기 + 제출 (firebase-admin)
 * @module lib/data/forms
 *
 * Firestore 경로:
 *   Form:       customers/{customerId}/forms/{formId}
 *   Submission: customers/{customerId}/forms/{formId}/submissions/{submissionId}
 */

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import { fetchFromConsole, isApiMode } from "../lib/client.js";
import type { Form, FormField } from "../types.js";


/**
 * slug로 폼 조회 (active만)
 */
async function directFetchFormBySlug(
  slug: string
): Promise<Form | null> {
  const snap = await db()
    .collection("customers")
    .doc(getCustomerId())
    .collection("forms")
    .where("slug", "==", slug)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (snap.empty) return null;

  const data = snap.docs[0].data();
  return {
    formId: data.formId,
    title: data.title,
    description: data.description,
    slug: data.slug,
    fields: (data.fields ?? [])
      .map(
        (f: {
          id: string;
          type: string;
          label: string;
          required: boolean;
          order: number;
          placeholder?: string;
          helpText?: string;
          options?: { value: string; label: string }[];
          file?: { maxFiles: number; maxSizeMB: number; accept: string[] };
        }) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          required: f.required,
          order: f.order,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
          file: f.file,
        })
      )
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    submit: {
      successMessage: data.submit?.successMessage ?? "제출이 완료되었습니다.",
      redirectUrl: data.submit?.redirectUrl,
    },
  };
}

/**
 * 폼 제출 생성
 */
export async function createSubmission(
  formId: string,
  values: Record<string, unknown>,
  meta?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
  }
): Promise<string> {
  const formDoc = await db()
    .collection("customers")
    .doc(getCustomerId())
    .collection("forms")
    .doc(formId)
    .get();

  // 제출 시점의 필드 스냅샷 생성
  const formData = formDoc.data();
  const fieldsSnapshot = (formData?.fields ?? [])
    .map((f: { id: string; type: string; label: string; required: boolean; order: number }) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      required: f.required,
      order: f.order,
    }))
    .sort((a: { order: number }, b: { order: number }) => a.order - b.order);

  const colRef = db()
    .collection("customers")
    .doc(getCustomerId())
    .collection("forms")
    .doc(formId)
    .collection("submissions");

  const docRef = colRef.doc();
  const now = Timestamp.now();

  await docRef.set({
    schemaVersion: "v1",
    submissionId: docRef.id,
    values,
    fieldsSnapshot,
    meta: meta ?? {},
    createdAt: now,
    updatedAt: now,
  });

  // ── usageDaily 집계 ──
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = todayStr.replace(/-/g, "");
  await db()
    .doc(`customers/${getCustomerId()}/usageDaily/${today}`)
    .set(
      {
        date: todayStr,
        customerId: getCustomerId(),
        forms: { submissions: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return docRef.id;
}

// ── 공개 함수: 콘솔 API 경유, 미설정 시 Firebase 직접 접근 ──

export async function fetchFormBySlug(slug: string): Promise<Form | null> {
  if (!isApiMode()) return directFetchFormBySlug(slug);
  const r = await fetchFromConsole<{ form: Form | null }>({ resource: "form", slug: String(slug) });
  return r?.form ?? null;
}
