/**
 * 패키지 공통 설정 — Firebase 초기화 + 고객사 식별
 * @module lib/config
 *
 * 서버 전용. 클라이언트 컴포넌트에서 import 하지 말 것.
 *
 * customerId 는 여기서 한 번만 읽는다. 각 함수의 인자로 받지 않는 이유는,
 * 호출부가 값을 잘못 넘겨 다른 고객사 경로에 쓰거나 임의 문자열을 경로
 * 세그먼트로 흘리는 사고를 구조적으로 막기 위해서다.
 */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
let cachedApp;
function resolveApp() {
    if (cachedApp)
        return cachedApp;
    const existing = getApps();
    if (existing.length > 0) {
        cachedApp = existing[0];
        return cachedApp;
    }
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        cachedApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET ||
                `${serviceAccount.project_id}.firebasestorage.app`,
        });
        return cachedApp;
    }
    // 폴백: projectId 만으로 초기화 (에뮬레이터 / ADC)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    cachedApp = initializeApp({
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET ||
            (projectId ? `${projectId}.firebasestorage.app` : undefined),
    });
    return cachedApp;
}
/** 고객사 ID. 설정되지 않았으면 즉시 실패시킨다 — 조용히 빈 결과를 주면 원인 파악이 늦다. */
export function getCustomerId() {
    const customerId = process.env.CUSTOMER_ID;
    if (!customerId) {
        throw new Error("[cms-client] CUSTOMER_ID 환경변수가 설정되지 않았습니다. .env 를 확인하세요.");
    }
    return customerId;
}
export function db() {
    return getFirestore(resolveApp());
}
export function bucket() {
    return getStorage(resolveApp()).bucket();
}
/** customers/{customerId} 하위 컬렉션 경로 */
export function customerPath(...segments) {
    return ["customers", getCustomerId(), ...segments].join("/");
}
