/**
 * 예약 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/reservations
 *
 * Server Component에서만 import.
 * Firestore 경로: customers/{customerId}/reservations/{reservationId}
 */
import type { Reservation } from "../types.js";
export declare function fetchReservationsByMonth(year: number, month: number): Promise<Reservation[]>;
export declare function fetchReservationsByDate(date: string): Promise<Reservation[]>;
