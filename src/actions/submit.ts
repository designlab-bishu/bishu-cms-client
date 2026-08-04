/**
 * 폼 제출
 * @module actions/submit
 */

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";

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
