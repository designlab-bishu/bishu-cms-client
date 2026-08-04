/**
 * 예약 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/reservations
 *
 * Server Component에서만 import.
 * Firestore 경로: customers/{customerId}/reservations/{reservationId}
 */
import type { Reservation } from "../types.js";
/**
 * 특정 월의 예약 목록 조회 (confirmed만, 마스킹 처리)
 */
export declare function fetchReservationsByMonth(year: number, month: number): Promise<Reservation[]>;
/**
 * 특정 날짜의 예약 목록 조회
 */
export declare function fetchReservationsByDate(dateStr: string): Promise<Reservation[]>;
