/**
 * 사이트 → CMS 쓰기 동작 (사용량 집계)
 * @module actions/track
 *
 * 콘솔의 /usage 화면과 청구 산정의 근거가 되는 값이다.
 */
import type { PopupEventType } from "../types.js";
export declare function trackPopupEvent(eventType: PopupEventType): Promise<void>;
export declare function incrementPostViewCount(boardId: string, postId: string): Promise<void>;
