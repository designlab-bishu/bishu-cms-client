"use client";

/**
 * 사이트 공통 위젯 (챗봇 · GA4 · 첫 진입 경로 · 기기 종류)
 * @module client/BishuWidgets
 *
 * 구축 시 이 컴포넌트 하나만 layout 에 넣으면, 이후 챗봇을 켜고 끄거나
 * GA4 를 붙이는 일이 **콘솔 토글만으로** 끝난다. 사이트 코드를 다시 열 필요가 없다.
 *
 * 나중에 모든 사이트에 심어야 할 것이 생겨도 패키지 버전만 올리면 따라온다.
 *
 * 스크립트는 JSX 로 렌더하지 않고 useEffect 에서 주입한다.
 * React 가 렌더한 <script> 는 브라우저가 실행하지 않기 때문이다.
 */

import { useEffect } from "react";
import type { SiteConfig } from "./types.js";
import { classifyEntry, encodeEntry, ENTRY_COOKIE } from "../lib/entry-source.js";
import { DEVICE_COOKIE, detectBrowserDevice } from "../lib/device.js";

function injectScript(
  attrs: Record<string, string>,
  inline?: string
): HTMLScriptElement {
  const el = document.createElement("script");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (inline) el.textContent = inline;
  document.head.appendChild(el);
  return el;
}

export function BishuWidgets({ config }: { config: SiteConfig | null }) {
  const { customerId, chatbotEnabled, ga4MeasurementId, consoleUrl } =
    config ?? ({} as Partial<SiteConfig>);

  // ── GA4 ──
  useEffect(() => {
    if (!ga4MeasurementId) return;
    const loader = injectScript({
      src: `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`,
      async: "",
      "data-bishu": "ga4",
    });
    const init = injectScript(
      { "data-bishu": "ga4-init" },
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
        `gtag('js',new Date());gtag('config','${ga4MeasurementId}');`
    );
    return () => {
      loader.remove();
      init.remove();
    };
  }, [ga4MeasurementId]);

  // ── 첫 진입 경로 (v0.14.0 · 콘솔 FORM-P-179) ──
  // 이번 방문의 첫 페이지에서 한 번만 적는다. 세션 쿠키라 브라우저를 닫으면 사라진다.
  // 서버의 createSubmission 이 읽어 유입 채널로 보낸다 — 전체 주소 · 검색어는 남기지 않는다.
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.startsWith(`${ENTRY_COOKIE}=`))) return;
    const source = classifyEntry(window.location.href, document.referrer);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ENTRY_COOKIE}=${encodeEntry(source)}; Path=/; SameSite=Lax${secure}`;
  }, []);

  // ── 기기 종류 (v0.16.0 · 콘솔 FORM-P-183) ──
  // mobile · pc · tablet 한 단어만 적는다. UA 원문 · 화면 크기는 남기지 않는다.
  // 판별하지 못하면 적지 않는다 — 서버의 createSubmission 이 기기 없이 보낸다.
  useEffect(() => {
    const device = detectBrowserDevice();
    if (!device) return;
    if (document.cookie.split("; ").includes(`${DEVICE_COOKIE}=${device}`)) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${DEVICE_COOKIE}=${device}; Path=/; SameSite=Lax${secure}`;
  }, []);

  // ── 챗봇 ──
  useEffect(() => {
    if (!chatbotEnabled || !customerId || !consoleUrl) return;
    const el = injectScript({
      src: `${consoleUrl.replace(/\/+$/, "")}/chatbot.js`,
      "data-customer-id": customerId,
      "data-api-base": consoleUrl.replace(/\/+$/, ""),
      "data-bishu": "chatbot",
      async: "",
    });
    return () => {
      el.remove();
      // 위젯이 만든 DOM 도 함께 정리한다 (설정이 꺼졌을 때 잔상 방지)
      document.getElementById("bishu-chatbot-widget")?.remove();
    };
  }, [chatbotEnabled, customerId, consoleUrl]);

  return null;
}
