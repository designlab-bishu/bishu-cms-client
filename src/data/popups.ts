/**
 * 팝업 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/popups
 *
 * Firestore 경로: customers/{customerId}/popups/{popupId}
 */

import { Timestamp } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import type { Popup } from "../types.js";


/**
 * 현재 활성 팝업 목록 조회
 * - status === "active"
 * - 현재 시각이 startDate ~ endDate 사이
 */
export async function fetchActivePopups(): Promise<Popup[]> {
  try {
    const now = Timestamp.now();

    const snap = await db()
      .collection("customers")
      .doc(getCustomerId())
      .collection("popups")
      .where("status", "==", "active")
      .where("startDate", "<=", now)
      .get();

    const results: Popup[] = [];

    for (const doc of snap.docs) {
      const d = doc.data();
      // endDate가 현재보다 이전이면 제외
      if (d.endDate && d.endDate.toDate() < now.toDate()) continue;

      results.push({
        popupId: d.popupId,
        title: d.title,
        imageUrl: d.imageUrl,
        width: d.width,
        height: d.height,
        position: d.position ?? { x: 100, y: 100 },
        link: d.link ?? "",
        linkTarget: d.linkTarget ?? "_blank",
        startDate: d.startDate?.toDate().toISOString() ?? "",
        endDate: d.endDate?.toDate().toISOString() ?? "",
        targetPages: d.targetPages,
      });
    }

    return results;
  } catch (err) {
    console.error("Failed to fetch popups:", err);
    return [];
  }
}
