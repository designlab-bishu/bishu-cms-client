/**
 * 폼 데이터 서버사이드 읽기 + 제출 (firebase-admin)
 * @module lib/data/forms
 *
 * Firestore 경로:
 *   Form:       customers/{customerId}/forms/{formId}
 *   Submission: customers/{customerId}/forms/{formId}/submissions/{submissionId}
 */
import type { Form } from "../types.js";
/**
 * slug로 폼 조회 (active만)
 */
export declare function fetchFormBySlug(slug: string): Promise<Form | null>;
/**
 * 폼 제출 생성
 */
export declare function createSubmission(formId: string, values: Record<string, unknown>, meta?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
}): Promise<string>;
