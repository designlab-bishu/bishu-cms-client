/**
 * 폼 제출
 * @module actions/submit
 */

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import { postToConsole, isApiMode } from "../lib/client.js";

async function directCreateSubmission(
  formSlug: string,
  values: Record<string, unknown>,
  meta?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
  }
): Promise<string> {
  const formQuery = await db()
    .collection("customers")
    .doc(getCustomerId())
    .collection("forms")
    .where("slug", "==", formSlug)
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (formQuery.empty) throw new Error("form_not_active");

  const formData = formQuery.docs[0].data();
  const formId: string = formData.formId ?? formQuery.docs[0].id;
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

/**
 * 폼 제출.
 *
 * 폼은 **슬러그로 조회**한다. 사이트가 보낸 문서 ID 를 그대로 쓰면 임의 경로에
 * 쓰게 되므로(2026-08-03 studio-bishu 사례), 서버가 조회한 값만 사용한다.
 *
 * 실패 시 예외를 던진다 — 조용히 실패하면 고객 문의가 유실된다.
 */
export async function createSubmission(
  formSlug: string,
  values: Record<string, unknown>,
  meta?: { pageUrl?: string; referrer?: string; userAgent?: string }
): Promise<string> {
  if (!isApiMode()) return directCreateSubmission(formSlug, values, meta);

  const res = await postToConsole<{ submissionId: string }>({
    action: "submit",
    formSlug,
    values,
    meta,
  });
  if (!res.ok) throw new Error(`submission_failed:${res.reason}`);
  return res.data.submissionId;
}
