// 폼 제출 공용 함수 단위 테스트 — `npm test` (빌드 후 dist 를 시험한다)
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { submitCmsForm } from "../dist/actions/submit-form.js";

const realFetch = globalThis.fetch;
const realWarn = console.warn;
const realError = console.error;

/** 콘솔 폼 정의 — 동의 칸이 맨 앞에 끼어들어 order 가 밀린 상태 */
const FORM = {
  formId: "f1",
  title: "문의",
  slug: "inquiry",
  submit: { successMessage: "감사합니다" },
  fields: [
    { id: "field_consent", type: "consent", label: "개인정보 동의", required: true, order: 0 },
    { id: "field_name", type: "text", label: "이름", required: true, order: 1 },
    { id: "field_email", type: "email", label: "이메일", required: true, order: 2 },
    { id: "field_memo", type: "textarea", label: "내용", required: false, order: 3 },
  ],
};
const FORM_NO_CONSENT = { ...FORM, fields: FORM.fields.filter((f) => f.type !== "consent") };

let sent;
let warnings;

/** 콘솔 쓰기 응답 — 보낸 본문을 `sent` 에 남긴다 */
function respond(status, body) {
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(init.body);
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  };
}

beforeEach(() => {
  process.env.CMS_API_URL = "https://console.test";
  process.env.CMS_API_KEY = "test-key";
  process.env.CUSTOMER_ID = "test-customer";
  sent = undefined;
  warnings = [];
  console.warn = (msg) => warnings.push(String(msg));
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.warn = realWarn;
  console.error = realError;
});

test("fieldMap — 사이트 키를 콘솔 필드 id 로 옮기고 동의를 채운다", async () => {
  respond(200, { submissionId: "sub_1" });
  const result = await submitCmsForm(
    "inquiry",
    { name: "홍길동", email: "a@b.co", memo: "", extra: "안 보냄" },
    { form: FORM, consent: true, fieldMap: { name: "field_name", email: "field_email", memo: "field_memo" } }
  );
  assert.deepEqual(result, { ok: true, submissionId: "sub_1" });
  assert.equal(sent.action, "submit");
  assert.equal(sent.formSlug, "inquiry");
  // 빈 값 · 매핑에 없는 키는 보내지 않는다
  assert.deepEqual(sent.values, { field_name: "홍길동", field_email: "a@b.co", field_consent: true });
  assert.equal(sent.meta, undefined);
  assert.deepEqual(warnings, []);
});

test("fieldMap 생략 — 키가 곧 필드 id (템플릿 방식)", async () => {
  respond(200, { submissionId: "sub_2" });
  const result = await submitCmsForm(
    "inquiry",
    { field_name: "홍길동", field_email: "a@b.co", field_consent: true },
    { form: FORM }
  );
  assert.equal(result.ok, true);
  assert.deepEqual(sent.values, { field_name: "홍길동", field_email: "a@b.co", field_consent: true });
});

test("동의 칸이 있는데 체크하지 않으면 콘솔을 부르지 않고 거부", async () => {
  respond(200, { submissionId: "never" });
  const result = await submitCmsForm("inquiry", { field_name: "홍길동" }, { form: FORM });
  assert.deepEqual(result, { ok: false, reason: "consent_required", message: "개인정보 수집·이용에 동의해 주세요." });
  assert.equal(sent, undefined);
});

test("동의 칸 값으로 true 가 아닌 것을 넣어도 채우지 않는다", async () => {
  respond(200, { submissionId: "never" });
  const result = await submitCmsForm("inquiry", { field_consent: "yes" }, { form: FORM });
  assert.equal(result.ok, false);
  assert.equal(sent, undefined);
});

test("짝이 끊긴 칸 · 빈 필수 칸은 로그로 — 값은 남기지 않는다", async () => {
  respond(200, { submissionId: "sub_3" });
  const result = await submitCmsForm(
    "inquiry",
    { name: "홍길동", email: "secret@b.co" },
    { form: FORM_NO_CONSENT, fieldMap: { name: "field_deleted", email: "field_email" } }
  );
  assert.equal(result.ok, true);
  assert.deepEqual(sent.values, { field_email: "secret@b.co" });
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /name → field_deleted/);
  assert.match(warnings[1], /이름 \(field_name\)/);
  assert.ok(warnings.every((w) => !w.includes("홍길동") && !w.includes("secret@b.co")));
});

test("콘솔 거부 — 콘솔 문구를 그대로", async () => {
  respond(400, { error: "value_too_long", message: "\"내용\" 항목이 너무 깁니다. 줄여서 다시 제출해주세요." });
  const result = await submitCmsForm("inquiry", { field_name: "x" }, { form: FORM_NO_CONSENT });
  assert.deepEqual(result, {
    ok: false,
    reason: "value_too_long",
    message: "\"내용\" 항목이 너무 깁니다. 줄여서 다시 제출해주세요.",
  });
});

test("문구 없는 사유 — 기본 문구 · 사이트 덮어쓰기", async () => {
  respond(429, { error: "rate_limited" });
  const a = await submitCmsForm("inquiry", { field_name: "x" }, { form: FORM_NO_CONSENT });
  assert.equal(a.ok === false && a.message, "요청이 많습니다. 잠시 후 다시 시도해 주세요.");

  respond(403, { error: "demo_readonly", message: "데모에서는 접수되지 않습니다." });
  const b = await submitCmsForm("inquiry", { field_name: "x" }, {
    form: FORM_NO_CONSENT,
    messages: { demo_readonly: "샘플 사이트라 접수되지 않습니다." },
  });
  assert.equal(b.ok === false && b.message, "샘플 사이트라 접수되지 않습니다.");
});

test("form 을 넘기지 않으면 슬러그로 조회 · 없으면 form_not_found", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ form: null }), { status: 200 });
  const result = await submitCmsForm("missing", { a: 1 });
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "form_not_found");
});

test("네트워크 실패 — 예외 없이 기본 문구", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  const result = await submitCmsForm("inquiry", { field_name: "x" }, { form: FORM_NO_CONSENT });
  assert.deepEqual(result, { ok: false, reason: "network_error", message: "제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
});
