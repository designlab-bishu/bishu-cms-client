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
import { type Firestore } from "firebase-admin/firestore";
/** 고객사 ID. 설정되지 않았으면 즉시 실패시킨다 — 조용히 빈 결과를 주면 원인 파악이 늦다. */
export declare function getCustomerId(): string;
export declare function db(): Firestore;
export declare function bucket(): import("@google-cloud/storage").Bucket;
/** customers/{customerId} 하위 컬렉션 경로 */
export declare function customerPath(...segments: string[]): string;
