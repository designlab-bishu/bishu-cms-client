/**
 * 팝업 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/popups
 */
import type { Popup } from "../types.js";
/**
 * 현재 활성 팝업 목록 조회
 *
 * 활성 여부(status·노출 기간) 판정은 콘솔이 한다.
 * 설정이 없거나 콘솔 장애면 빈 배열 — 팝업 때문에 페이지가 죽지 않게 한다.
 */
export declare function fetchActivePopups(): Promise<Popup[]>;
