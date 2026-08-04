/**
 * 팝업 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/popups
 *
 * Firestore 경로: customers/{customerId}/popups/{popupId}
 */
import type { Popup } from "../types.js";
/**
 * 현재 활성 팝업 목록 조회
 * - status === "active"
 * - 현재 시각이 startDate ~ endDate 사이
 */
export declare function fetchActivePopups(): Promise<Popup[]>;
