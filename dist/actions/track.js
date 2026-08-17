/**
 * 사이트 → CMS 쓰기 동작 (사용량 집계)
 * @module actions/track
 *
 * 콘솔의 /usage 화면과 청구 산정의 근거가 되는 값이다.
 */
import { postToConsole } from "../lib/client.js";
/**
 * 사용량 집계는 **실패해도 예외를 던지지 않는다.**
 * 통계 기록 실패로 방문자 화면이 깨지면 안 된다.
 */
export async function trackPopupEvent(eventType) {
    await postToConsole({ action: "trackPopup", eventType });
}
export async function incrementPostViewCount(boardId, postId) {
    await postToConsole({ action: "viewPost", boardId, postId });
}
