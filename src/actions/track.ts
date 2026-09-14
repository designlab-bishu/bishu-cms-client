/**
 * 사이트 → CMS 쓰기 동작 (사용량 집계)
 * @module actions/track
 *
 * 콘솔의 /usage 화면과 청구 산정의 근거가 되는 값이다.
 */

import { getCustomerId } from "../lib/config.js";
import { postToConsole } from "../lib/client.js";
import type { PopupEventType } from "../types.js";

/**
 * 사용량 집계는 **실패해도 예외를 던지지 않는다.**
 * 통계 기록 실패로 방문자 화면이 깨지면 안 된다.
 *
 * `popupId` 를 주면 고객사 합계에 더해 `popups/{id}/stats/{날짜}` 에 팝업별로도
 * 쌓인다 (POP-P-94). 생략하면 합계만 — 옛 호출과 호환된다.
 */
export async function trackPopupEvent(
  eventType: PopupEventType,
  popupId?: string
): Promise<void> {
  await postToConsole({
    action: "trackPopup",
    eventType,
    ...(popupId ? { popupId } : {}),
  });
}

export async function incrementPostViewCount(
  boardId: string,
  postId: string
): Promise<void> {
  await postToConsole({ action: "viewPost", boardId, postId });
}
