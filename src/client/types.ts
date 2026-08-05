/**
 * 위젯 설정 타입 (브라우저·서버 공용)
 * @module client/types
 */

export interface SiteConfig {
  customerId: string;
  /** 챗봇 위젯 스크립트를 심을지 여부 */
  chatbotEnabled: boolean;
  /** GA4 측정 ID. 없으면 태그를 심지 않는다. */
  ga4MeasurementId: string | null;
  /** 챗봇 스크립트를 받아올 콘솔 주소 */
  consoleUrl: string;
}
