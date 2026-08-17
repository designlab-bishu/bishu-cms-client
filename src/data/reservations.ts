/**
 * 예약 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/reservations
 *
 * Server Component에서만 import.
 * Firestore 경로: customers/{customerId}/reservations/{reservationId}
 */

import { getCustomerId } from "../lib/config.js";
import { fetchFromConsole } from "../lib/client.js";
import { maskName } from "../lib/mask.js";
import type { Reservation, ReservationProduct } from "../types.js";

// ── 공개 함수: 콘솔 API 경유, 미설정 시 Firebase 직접 접근 ──

export async function fetchReservationsByMonth(year: number, month: number): Promise<Reservation[]> {
  const r = await fetchFromConsole<{ reservations: Reservation[] }>({ resource: "reservations", year: String(year), month: String(month) });
  return r?.reservations ?? [];
}
export async function fetchReservationsByDate(date: string): Promise<Reservation[]> {
  const r = await fetchFromConsole<{ reservations: Reservation[] }>({ resource: "reservations", date: String(date) });
  return r?.reservations ?? [];
}
