/**
 * 예약 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/reservations
 *
 * Server Component에서만 import.
 * Firestore 경로: customers/{customerId}/reservations/{reservationId}
 */
import { fetchFromConsole } from "../lib/client.js";
// ── 공개 함수: 콘솔 API 경유, 미설정 시 Firebase 직접 접근 ──
export async function fetchReservationsByMonth(year, month) {
    const r = await fetchFromConsole({ resource: "reservations", year: String(year), month: String(month) });
    return r?.reservations ?? [];
}
export async function fetchReservationsByDate(date) {
    const r = await fetchFromConsole({ resource: "reservations", date: String(date) });
    return r?.reservations ?? [];
}
