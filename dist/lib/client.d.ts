/**
 * 콘솔 API 호출 클라이언트 (서버 전용)
 * @module lib/client
 *
 * 고객사 사이트가 Firebase 를 직접 보지 않고 콘솔을 경유하게 하는 통로.
 * 사이트에는 Firebase 서비스 계정 키 대신 고객사 API 키만 있으면 된다.
 *
 * 필요한 환경변수:
 *   CMS_API_URL   콘솔 주소 (예: https://admin.bishu.co.kr)
 *   CMS_API_KEY   고객사 API 키 (콘솔 → 고객사 관리에서 발급)
 *   CUSTOMER_ID   고객사 ID
 */
export declare class CmsConfigError extends Error {
}
/** 콘솔 API 를 쓰도록 설정되어 있는지. 미설정이면 Firebase 직접 접근으로 폴백한다. */
export declare function isApiMode(): boolean;
/**
 * 콘솔의 공개 조회 API 를 호출한다.
 *
 * **실패해도 예외를 던지지 않는다.** 콘솔 장애나 네트워크 문제로 페이지 전체가
 * 500 이 되는 것을 막기 위해, 호출부가 빈 결과로 처리할 수 있도록 null 을 반환한다.
 * 설정 오류(환경변수 누락·인증 실패)는 로그로 분명히 남긴다.
 */
export declare function fetchFromConsole<T>(params: Record<string, string>): Promise<T | null>;
