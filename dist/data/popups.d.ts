/**
 * 팝업 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/popups
 *
 * Firestore 경로: customers/{customerId}/popups/{popupId}
 */
import type { Popup } from "../types.js";
export declare function fetchActivePopups(): Promise<Popup[]>;
