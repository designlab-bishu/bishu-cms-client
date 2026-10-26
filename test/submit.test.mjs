// 제출 실패 사유 · 보안 헤더 단위 테스트 — `npm test` (빌드 후 dist 를 시험한다)
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createSubmission, SubmissionError } from "../dist/actions/submit.js";
import { securityHeaders, buildCsp } from "../dist/config/security-headers.js";

const realFetch = globalThis.fetch;
const realConsoleError = console.error;

/** 콘솔 응답을 흉내 낸다 */
function respond(status, body) {
  globalThis.fetch = async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

beforeEach(() => {
  process.env.CMS_API_URL = "https://console.test";
  process.env.CMS_API_KEY = "test-key";
  process.env.CUSTOMER_ID = "test-customer";
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realConsoleError;
});

test("성공하면 submissionId", async () => {
  respond(200, { submissionId: "sub_1" });
  assert.equal(await createSubmission("inquiry", { a: "b" }), "sub_1");
});

test("콘솔 거부 — 사유 코드와 문구가 실린다", async () => {
  respond(400, { error: "consent_required", message: "개인정보 수집·이용에 동의해 주세요." });
  await assert.rejects(createSubmission("inquiry", {}), (err) => {
    assert.ok(err instanceof SubmissionError);
    assert.equal(err.message, "submission_failed:consent_required");
    assert.equal(err.reason, "consent_required");
    assert.equal(err.userMessage, "개인정보 수집·이용에 동의해 주세요.");
    return true;
  });
});

test("데모 고객사 — demo_readonly", async () => {
  respond(403, { error: "demo_readonly", message: "데모에서는 접수되지 않습니다." });
  await assert.rejects(createSubmission("inquiry", {}), { message: "submission_failed:demo_readonly" });
});

test("문구 없는 사유 — 코드만", async () => {
  respond(429, { error: "rate_limited" });
  await assert.rejects(createSubmission("inquiry", {}), (err) => {
    assert.equal(err.reason, "rate_limited");
    assert.equal(err.userMessage, undefined);
    return true;
  });
});

test("본문이 JSON 이 아니면 http_<상태>", async () => {
  respond(502, "<html>Bad Gateway</html>");
  await assert.rejects(createSubmission("inquiry", {}), { message: "submission_failed:http_502" });
});

test("모양이 이상한 사유 코드는 버리고 http_<상태>", async () => {
  respond(400, { error: "<script>", message: 42 });
  await assert.rejects(createSubmission("inquiry", {}), (err) => {
    assert.equal(err.reason, "http_400");
    assert.equal(err.userMessage, undefined);
    return true;
  });
});

test("네트워크 실패 — network_error", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(createSubmission("inquiry", {}), { message: "submission_failed:network_error" });
});

test("보안 헤더 — X-XSS-Protection: 0", () => {
  const headers = securityHeaders({ consoleUrl: "https://console.test", csp: false });
  assert.deepEqual(
    headers.find((h) => h.key === "X-XSS-Protection"),
    { key: "X-XSS-Protection", value: "0" }
  );
});

test("CSP connect-src — GA4 맨 도메인 · Google 신호", () => {
  const connect = buildCsp({ consoleUrl: "https://console.test" })
    .split("; ")
    .find((d) => d.startsWith("connect-src "))
    .split(" ");
  assert.ok(connect.includes("https://analytics.google.com"));
  assert.ok(connect.includes("https://*.analytics.google.com"));
  assert.ok(connect.includes("https://stats.g.doubleclick.net"));
});
