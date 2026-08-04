/**
 * 사이트 → CMS 쓰기 동작 (사용량 집계)
 * @module actions/track
 *
 * 콘솔의 /usage 화면과 청구 산정의 근거가 되는 값이다.
 */

import { FieldValue } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import { postToConsole, isApiMode } from "../lib/client.js";
import type { PopupEventType } from "../types.js";

async function directTrackPopupEvent(eventType: PopupEventType): Promise<void> {
  
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

async function directIncrementPostViewCount(
  boardId: string,
  postId: string
): Promise<void> {
  
  await db()
    .doc(`customers/${getCustomerId()}/boards/${boardId}/posts/${postId}`)
    .update({
      "stats.viewCount": FieldValue.increment(1),
    });
}

/**
 * 사용량 집계는 **실패해도 예외를 던지지 않는다.**
 * 통계 기록 실패로 방문자 화면이 깨지면 안 된다.
 */
export async function trackPopupEvent(
  eventType: PopupEventType
): Promise<void> {
  if (!isApiMode()) {
    await directTrackPopupEvent(eventType).catch((e) =>
      console.error("[cms-client] 팝업 집계 실패:", e)
    );
    return;
  }
  await postToConsole({ action: "trackPopup", eventType });
}

export async function incrementPostViewCount(
  boardId: string,
  postId: string
): Promise<void> {
  if (!isApiMode()) {
    await directIncrementPostViewCount(boardId, postId).catch((e) =>
      console.error("[cms-client] 조회수 집계 실패:", e)
    );
    return;
  }
  await postToConsole({ action: "viewPost", boardId, postId });
}
