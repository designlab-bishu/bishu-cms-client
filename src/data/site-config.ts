/**
 * 사이트 위젯 설정 조회
 * @module data/site-config
 *
 * <BishuWidgets /> 에 넘길 값을 서버에서 받아온다.
 * 브라우저로 전달되는 값이므로 비밀값은 포함하지 않는다.
 */

import { fetchFromConsole, isApiMode } from "../lib/client.js";
import { getCustomerId } from "../lib/config.js";
import type { SiteConfig } from "../client/types.js";

/**
 * 조회 실패 시 **위젯을 심지 않는 안전한 기본값**을 반환한다.
 * 콘솔 장애로 챗봇이 잠깐 안 뜨는 편이, 페이지가 죽는 것보다 낫다.
 */
export async function fetchSiteConfig(): Promise<SiteConfig> {
  const consoleUrl = (process.env.CMS_API_URL ?? "").replace(/\/+$/, "");
  const fallback: SiteConfig = {
    customerId: process.env.CUSTOMER_ID ?? "",
    chatbotEnabled: false,
    ga4MeasurementId: null,
    consoleUrl,
  };

  if (!isApiMode()) return fallback;

  const r = await fetchFromConsole<{
    siteConfig: Omit<SiteConfig, "consoleUrl">;
  }>({ resource: "siteConfig" });

  if (!r?.siteConfig) return fallback;

  return { ...r.siteConfig, consoleUrl, customerId: getCustomerId() };
}
