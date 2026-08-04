/**
 * 폼 제출
 * @module actions/submit
 */
export declare function createSubmission(formId: string, values: Record<string, unknown>, meta?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
}): Promise<string>;
