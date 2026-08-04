/**
 * 사이트 → CMS 쓰기 동작 (사용량 집계)
 * @module actions/track
 *
 * 콘솔의 /usage 화면과 청구 산정의 근거가 되는 값이다.
 */

import { FieldValue } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import type { PopupEventType } from "../types.js";

export async function trackPopupEvent(eventType: PopupEventType): Promise<void> {
  
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = todayStr.replace(/-/g, "");
  const field =
    eventType === "impression"
      ? "impressions"
      : eventType === "click"
        ? "clicks"
        : "dismisses";

  await db()
    .doc(`customers/${getCustomerId()}/usageDaily/${today}`)
    .set(
      {
        date: todayStr,
        customerId: getCustomerId(),
        popups: { [field]: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function incrementPostViewCount(
  boardId: string,
  postId: string
): Promise<void> {
  
  await db()
    .doc(`customers/${getCustomerId()}/boards/${boardId}/posts/${postId}`)
    .update({
      "stats.viewCount": FieldValue.increment(1),
    });
}
