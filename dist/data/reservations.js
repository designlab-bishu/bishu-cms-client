/**
 * 예약 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/reservations
 *
 * Server Component에서만 import.
 * Firestore 경로: customers/{customerId}/reservations/{reservationId}
 */
import { Timestamp } from "firebase-admin/firestore";
import { db, getCustomerId } from "../lib/config.js";
import { maskName } from "../lib/mask.js";
/**
 * 특정 월의 예약 목록 조회 (confirmed만, 마스킹 처리)
 */
export async function fetchReservationsByMonth(year, month) {
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
export async function fetchReservationsByDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const all = await fetchReservationsByMonth(year, month);
    return all.filter((r) => r.date.startsWith(dateStr));
}
