// 기기 판별 단위 테스트 — `npm test` (빌드 후 dist 를 시험한다)
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDevice, decodeDevice } from "../dist/lib/device.js";

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidPhone:
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  samsungInternet:
    "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  naverApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.6.3)",
  ipadOld:
    "Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X710N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  kindle:
    "Mozilla/5.0 (Linux; Android 9; KFMAWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/124.3.1 like Chrome/124.0.0.0 Safari/537.36",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  windowsChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
};

test("UA 문자열 — 휴대폰은 mobile", () => {
  assert.equal(detectDevice({ userAgent: UA.iphone }), "mobile");
  assert.equal(detectDevice({ userAgent: UA.androidPhone }), "mobile");
  assert.equal(detectDevice({ userAgent: UA.samsungInternet }), "mobile");
  assert.equal(detectDevice({ userAgent: UA.naverApp }), "mobile");
});

test("UA 문자열 — iPad · 안드로이드 태블릿 · 킨들은 tablet", () => {
  assert.equal(detectDevice({ userAgent: UA.ipadOld }), "tablet");
  assert.equal(detectDevice({ userAgent: UA.androidTablet }), "tablet");
  assert.equal(detectDevice({ userAgent: UA.kindle }), "tablet");
});

test("UA 문자열 — 데스크톱은 pc", () => {
  assert.equal(detectDevice({ userAgent: UA.macSafari, platform: "MacIntel", maxTouchPoints: 0 }), "pc");
  assert.equal(detectDevice({ userAgent: UA.windowsChrome, platform: "Win32", maxTouchPoints: 0 }), "pc");
  assert.equal(detectDevice({ userAgent: UA.windowsEdge }), "pc");
});

test("iPadOS 데스크톱 모드 — 맥 UA + MacIntel + 터치 2점 이상은 tablet", () => {
  assert.equal(detectDevice({ userAgent: UA.macSafari, platform: "MacIntel", maxTouchPoints: 5 }), "tablet");
  // 터치 1점(일부 맥 트랙패드 보고)은 pc
  assert.equal(detectDevice({ userAgent: UA.macSafari, platform: "MacIntel", maxTouchPoints: 1 }), "pc");
});

test("userAgentData 가 있으면 우선한다", () => {
  // mobile=true 면 UA 와 상관없이 mobile
  assert.equal(detectDevice({ userAgent: UA.windowsChrome, uaDataMobile: true }), "mobile");
  // 안드로이드 태블릿 Chrome 은 mobile=false · platform Android 로 온다
  assert.equal(detectDevice({ userAgent: UA.androidTablet, uaDataMobile: false, uaDataPlatform: "Android" }), "tablet");
  // UA 축소로 단서가 빠져도 platform 이 Android 면 tablet
  assert.equal(detectDevice({ userAgent: "", uaDataMobile: false, uaDataPlatform: "Android" }), "tablet");
  // 데스크톱 Chrome
  assert.equal(detectDevice({ userAgent: UA.windowsChrome, uaDataMobile: false, uaDataPlatform: "Windows" }), "pc");
});

test("단서가 없으면 판별하지 않는다", () => {
  assert.equal(detectDevice({}), undefined);
  assert.equal(detectDevice({ userAgent: "" }), undefined);
});

test("쿠키 값 — 세 단어만 받는다", () => {
  assert.equal(decodeDevice("mobile"), "mobile");
  assert.equal(decodeDevice("pc"), "pc");
  assert.equal(decodeDevice("tablet"), "tablet");
  assert.equal(decodeDevice("desktop"), null);
  assert.equal(decodeDevice(UA.iphone), null);
  assert.equal(decodeDevice(undefined), null);
});
