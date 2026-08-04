/**
 * 예약 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/reservations
 *
 * Server Component에서만 import.
 * Firestore 경로: customers/{customerId}/reservations/{reservationId}
 */
import { Timestamp } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import { fetchFromConsole, isApiMode } from "../lib/client.js";
import { maskName } from "../lib/mask.js";
/**
 * 특정 월의 예약 목록 조회 (confirmed만, 마스킹 처리)
 */
async function directFetchReservationsByMonth(year, month) {
    const start = Timestamp.fromDate(new Date(year, month - 1, 1));
    const end = Timestamp.fromDate(new Date(year, month, 1));
    const snap = await db()
        .collection("customers")
        .doc(getCustomerId())
        .collection("reservations")
        .where("date", ">=", start)
        .where("date", "<", end)
        .orderBy("date", "asc")
        .get();
    return snap.docs
        .map((doc) => {
        const data = doc.data();
        return {
            reservationId: data.reservationId,
            date: data.date.toDate().toISOString(),
            startTime: data.startTime ?? null,
            endTime: data.endTime ?? null,
            isAllDay: data.isAllDay ?? false,
            productName: data.productName,
            productColor: data.productColor,
            // 🎨 [커스터마이즈] 마스킹 처리 — maskName 함수를 수정하여 규칙 변경 가능
            customerName: maskName(data.customerName ?? ""),
            status: data.status,
        };
    })
        .filter((r) => r.status === "confirmed");
}
/**
 * 특정 날짜의 예약 목록 조회
 */
async function directFetchReservationsByDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const all = await directFetchReservationsByMonth(year, month);
    return all.filter((r) => r.date.startsWith(dateStr));
}
// ── 공개 함수: 콘솔 API 경유, 미설정 시 Firebase 직접 접근 ──
export async function fetchReservationsByMonth(year, month) {
    if (!isApiMode())
        return directFetchReservationsByMonth(year, month);
    const r = await fetchFromConsole({ resource: "reservations", year: String(year), month: String(month) });
    return r?.reservations ?? [];
}
export async function fetchReservationsByDate(date) {
    if (!isApiMode())
        return directFetchReservationsByDate(date);
    const r = await fetchFromConsole({ resource: "reservations", date: String(date) });
    return r?.reservations ?? [];
}
