/**
 * 사이트 → CMS 쓰기 동작 (사용량 집계)
 * @module actions/track
 *
 * 콘솔의 /usage 화면과 청구 산정의 근거가 되는 값이다.
 */
import type { PopupEventType } from "../types.js";
/**
 * 사용량 집계는 **실패해도 예외를 던지지 않는다.**
 * 통계 기록 실패로 방문자 화면이 깨지면 안 된다.
 */
export declare function trackPopupEvent(eventType: PopupEventType): Promise<void>;
export declare function incrementPostViewCount(boardId: string, postId: string): Promise<void>;
