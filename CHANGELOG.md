# Changelog

사이트는 `github:designlab-bishu/bishu-cms-client#vX.Y.Z` 태그로 설치한다.
응답 형태는 **더하기만 하고 빼지 않는다** (콘솔 API-P-30) — minor 올림은 사이트 코드를 고치지 않아도 동작한다.

## v0.17.0 — 2026-10-21

폼 제출 공용 함수를 더한다. 뺀 것 · 바뀐 것은 없다 — 패키지만 올려도 기존 제출은 그대로 동작한다.

### 추가
- **`submitCmsForm(formSlug, values, options?)`** — 사이트 폼 값을 콘솔 폼 정의에 맞춰 제출한다.
  - **id 로 짝짓기** — `fieldMap`(사이트 키 → 콘솔 필드 id)을 주면 그 표대로, 생략하면 `values` 의 키를 필드 id 로 본다(템플릿 방식).
    빈 값은 보내지 않는다. 정의에 없는 필드를 가리키는 키 · 비어 있는 필수 칸은 서버 로그에 경고로 남긴다 (키 · 라벨만, 값은 남기지 않는다).
  - **동의(consent) 채우기** — `consent: true` 일 때만 폼의 동의 칸을 `true` 로 채운다. 동의 칸이 있는데 체크하지 않았으면 **콘솔을 부르지 않고** `consent_required` 로 돌려준다.
  - **거부 문구** — 사이트 `messages` 덮어쓰기 → 콘솔이 실어 보낸 문구 → 기본 문구 순. 콘솔은 `invalid_file` · `value_too_long` 등에 이미 한국어 문구를 싣는다.
  - **예외를 던지지 않는다** — `{ ok: true, submissionId } | { ok: false, reason, message }`.
  - 유입 채널 · 기기는 전처럼 쿠키에서 읽어 함께 보낸다. `meta` 는 보내지 않는다.
  - `form` 을 넘기면 다시 조회하지 않는다.
- `SubmissionError` 를 내보낸다 (v0.16.1 에서 생긴 `createSubmission` 의 실패 타입 — `reason` · `userMessage`).
- 타입 `FormSubmitResult` · `SubmitCmsFormOptions`.

### 사이트 쪽에서 할 일
**급하지 않다** — 기존 코드는 그대로 동작한다. 다만 order · 「타입별 몇 번째」로 짝짓는 사이트는 콘솔에서 동의 칸을 추가하거나 순서를 바꾸면
**값이 조용히 다른 칸에 들어간다.** 콘솔 폼을 손대기 전에 아래로 옮긴다.

1. 콘솔 필드 id 를 확인해 사이트에 `사이트 키 → 필드 id` 표를 둔다 (`fetchFormBySlug(slug)` 의 `fields[].id`, 형태 `field_<숫자>`).
2. 제출 Server Action 을 `submitCmsForm(slug, data, { fieldMap, consent })` 로 바꾸고, 결과의 `message` 를 화면에 보인다.
3. `meta`(pageUrl · userAgent)를 보내던 코드는 지운다 — 콘솔이 저장하지 않는다(v0.13.0).
4. 첨부는 먼저 올린 뒤 `UploadedFile[]` 을 값으로 넘긴다 — 템플릿처럼 브라우저 직행(`issueUploadUrls` + `uploadFilesFromBrowser`)을 권한다.

사이트별
- **bishu-client-template** — `cms-actions.ts` 의 `submitForm` 본문을 `return submitCmsForm(formSlug, values)` 로 (결과 모양을 `{ success, error }` 로 바꿔 돌려주면 `FormRenderer` 는 그대로). `SUBMIT_ERROR_MESSAGES` 는 지운다. 동의 칸 값은 이미 `values[field.id] = true` 로 오므로 `consent` 옵션은 필요 없다.
- **abba** — template 과 같게. 지금은 거부 문구 매핑이 없어 동의 미체크도 「제출 중 오류」로 보이고, `meta` 에 User-Agent 원문을 보낸다.
- **designlab-bishu** — `src/lib/cms/data/contact.ts` 의 `ORDER_TO_KEY` 를 필드 id 표로, `saveContactToCms` 를 `submitCmsForm` 으로. 첨부는 서버 경유 `uploadFormFiles` 그대로 써도 된다.
  헤더는 위젯 연결 작업에서 `next.config.ts` 를 `securityHeaders()` 로 옮기므로 v0.16.1 의 `X-XSS-Protection: 0` 이 그대로 닿는다.
- **studio-bishu · changchanghan** — `inquiry-actions.ts` 의 「타입별 몇 번째」 매핑을 필드 id 표로, `headers()` · `meta` 제거.
- **콘솔에서 동의 칸을 추가하는 것은 사이트가 `consent` 를 넘기도록 바뀐 뒤에.** 그 전에 추가하면 모든 제출이 `consent_required` 로 거부된다.

## v0.16.1 — 2026-10-21

고친 것만 있다. 사이트 코드를 고치지 않아도 된다 — Renovate 가 Build 통과 후 자동 머지한다.

### 고침
- **보안 헤더 `X-XSS-Protection: 0`** — `securityHeaders()` 가 이제 내보낸다 (에이전시 글로벌 규칙).
  구형 브라우저의 XSS 필터를 끈다 — 필터 자체가 정보 유출 통로가 된 사례가 있고, XSS 방어는 CSP 가 맡는다.
- **제출 거부 사유가 사이트까지 온다** — 콘솔은 거부할 때 `{ error: "consent_required", message: "…" }` 를 돌려주는데
  패키지가 본문을 버리고 `submission_failed:http_400` 만 던지고 있었다. 그래서 템플릿의 거부 문구 매핑(v0.15)이
  한 번도 맞지 않았고 방문자는 늘 「제출 중 오류가 발생했습니다」만 봤다.
  이제 `createSubmission()` 은 `submission_failed:consent_required` 처럼 **콘솔 사유 코드**를 던진다.
  코드가 없거나 콘솔에 닿지 못하면 전처럼 `http_<상태>` · `network_error` · `config_error` 다.
  던지는 값은 `SubmissionError`(`Error` 하위)이고 `reason` · `userMessage`(콘솔이 실어 보낸 방문자용 문구)를 갖는다.

### 사이트 쪽에서 할 일
**없다.** 단, 사이트마다 이렇게 달라진다.
- template · abba · studio-bishu · changchanghan — `securityHeaders()` 를 써서 헤더가 바로 붙는다.
- **designlab-bishu** — `next.config.ts` 의 자체 헤더 배열에 `X-XSS-Protection: 1; mode=block` 이 있어 **이번 수정이 닿지 않는다.**
  사이트에서 `0` 으로 바꾸거나 `securityHeaders()` 로 옮긴다.
- template — `SUBMIT_ERROR_MESSAGES` 매핑이 이제 실제로 맞는다 (동의 미체크 · 데모 거부 문구가 뜬다).

## v0.16.0 — 2026-10-15

콘솔 리포트 기기별 문의율(FORM-P-183 · API-P-38)을 따른다. 뺀 것은 없다.

### 추가
- **기기 종류** — `BishuWidgets` 가 방문자 브라우저에서 기기를 `mobile` · `pc` · `tablet` 중 하나로 판별해 세션 쿠키 `bishu_device` 에 적고,
  `createSubmission()` 이 유입 채널과 함께 `source: { channel, domain, device }` 로 보낸다.
  판별은 `navigator.userAgentData.mobile` 이 있으면 우선, 없으면 UA 문자열(iPad · 안드로이드 태블릿 → tablet, 휴대폰 → mobile, 나머지 pc).
  iPadOS 데스크톱 모드(MacIntel + 터치 2점 이상)는 tablet. 판별하지 못하면 보내지 않는다.
  **User Agent 원문 · 화면 크기 · 브라우저 이름은 쿠키에도 콘솔에도 남지 않는다** — 세 갈래 한 단어뿐이다.
- 채널 쿠키 없이 기기 쿠키만 있어도 기기는 보낸다 (콘솔은 채널 「알 수 없음」 + 기기로 받는다).
- `npm test` — 기기 판별 단위 테스트(`test/device.test.mjs`, Node 내장 test runner · 추가 패키지 없음).

### 사이트 쪽에서 할 일
**없다** — 패키지만 올리면 된다. `BishuWidgets` 가 layout 에 있어야 쿠키가 적힌다. 없는 사이트의 제출은 기기 없이 저장된다.

## v0.15.0 — 2026-10-14

콘솔 개인정보 처리 보강(FORM-P-181)을 따른다. 뺀 것은 없다.

### 추가
- `FormFieldType` 에 `"consent"` — 개인정보 수집·이용 동의 체크박스 하나. 값은 `true` 로 보낸다. 늘 필수이고 체크하지 않으면 콘솔이 `consent_required` 로 거부한다.
- `FormField` 에 `consent?: { text, privacyPolicyUrl? }` — 체크 옆에 보일 문구와 처리방침 링크.
- 데모 고객사(`demo-customer`)의 제출 · 업로드 · 예약 접수/취소는 콘솔이 `demo_readonly`(403)로 거부한다 (API-P-35). 사이트는 「데모에서는 접수되지 않습니다」를 보인다.

### 사이트 쪽에서 할 일
`consent` 타입을 그리는 코드가 필요하다 — 모르는 타입은 텍스트 칸으로 폴백돼 **제출이 거부된다.**
템플릿(`bishu-client-template`) 의 `FormFieldInput.tsx`(체크박스 + 문구 + 링크) · `FormRenderer.tsx`(체크 필수 검증)를 맞춘다.
**콘솔에서 동의 칸을 추가하기 전에 사이트를 먼저 올린다.**

## v0.14.0 — 2026-10-14

콘솔 문의 흐름 보강(FORM-P-179 · API-P-36)을 따른다. 뺀 것은 없다.

### 추가
- **유입 채널** — `BishuWidgets` 가 방문 첫 페이지의 리퍼러 · UTM 으로 채널(네이버 검색 · 구글 검색 · 기타 검색 · SNS · 광고 · 직접 · 기타)을
  정해 세션 쿠키 `bishu_entry` 에 적고, `createSubmission()` 이 그 쿠키를 읽어 제출과 함께 `source: { channel, domain }` 으로 보낸다.
  전체 주소 · 검색어 · UTM 원문은 쿠키에도 콘솔에도 남지 않는다 — 채널 하나와 들어온 사이트 도메인뿐이다.
- `peerDependencies` 에 `next >=15` (선택). 서버가 쿠키를 읽는 데 `next/headers` 를 쓴다. Next 가 없거나 요청 범위 밖이면 채널 없이 보낸다(콘솔 「알 수 없음」).

### 사이트 쪽에서 할 일
**없다** — 패키지만 올리면 된다. 단 `BishuWidgets` 가 layout 에 있어야 쿠키가 적힌다. 없는 사이트의 제출은 「알 수 없음」이다.

## v0.13.0 — 2026-09-18

콘솔 폼 개편(FORM-P-123 · 128 · 129 · 154 · 155 · 161 · 162 · 172, API-P-33)을 따른다. 뺀 것은 없다.

### 추가
- `FormFieldType` 에 `"date"` · `"address"` — 날짜/시간은 ISO 8601 문자열, 주소는 문자열 배열 `[우편번호, 기본주소, 상세주소]`.
- `FormField` 에 `allowOther?: boolean` — 「기타」 선택지. 방문자가 적은 글을 **접두어 없이 그대로** 값으로 보낸다.
- `FormField` 에 `maxSelect?: number` — 체크박스 최대 선택 수.
- 옵션은 `value` 와 `label` 이 갈린다 — 사이트는 **`label` 을 보여주고 `value` 를 보낸다.** 옛 폼은 둘이 같아 그대로 동작한다.

### 바뀜
- `createSubmission()` 의 `meta` 인자를 `@deprecated` — 콘솔이 더 이상 저장하지 않는다. 보내도 무해하고, 시그니처는 그대로다.

### 사이트 쪽에서 할 일
패키지만 올리면 타입은 통과하지만 **새 타입 필드는 입력칸 없이 라벨만 그려진다** — 필수로 두면 제출이 막힌다.
템플릿(`bishu-client-template`) 의 `src/components/forms/FormFieldInput.tsx`(date · 기타 · 최대 선택 · 모르는 타입 폴백) ·
`AddressFieldInput.tsx` · `FormRenderer.tsx`(주소 필수 검증) 를 맞춘다. **콘솔에서 새 타입을 쓰기 전에 사이트를 먼저 올린다.**

## v0.12.0 — 2026-09-18

콘솔 게시판 개편(BRD-P-68 · 77, API-P-32)을 따른다. 뺀 것은 없다.

### 추가
- `Board` 에 `postsPerPage?: number` — 페이지당 노출 수(10·20·30·50). 사이트가 목록을 이 크기로 자른다. 없으면 20.
- `Board` 에 `description?: string` — 게시판 설명.

### 사이트 쪽에서 할 일
패키지만 올리면 타입은 통과하지만 목록은 여전히 전부 그려진다. 템플릿(`bishu-client-template`) 의
`src/app/(sub)/boards/[boardSlug]/page.tsx`(`?page=N` 슬라이스) 와 `src/components/boards/Pagination.tsx` 를 맞춘다.

## v0.11.0 — 2026-09-14

콘솔 팝업 모듈 개편(POP-P-91 · 93 · 94 · 95, API-P-31)을 따른다. 뺀 것은 없다.

### 추가
- `Popup` 에 `devices: ("desktop" | "mobile")[]` — 사이트가 UA 로 거른다. 둘 다면 전체.
- `Popup` 에 `heading?` · `description?` · `buttonLabel?` — 팝업 안 문구. 없으면 이미지만.
- `PopupEventType` 에 `"dismissToday"` (「오늘 하루 보지 않기」). 「닫기」는 그대로 `"dismiss"`.
- `trackPopupEvent(eventType, popupId?)` — `popupId` 를 주면 `popups/{id}/stats/{날짜}` 에 팝업별로도 쌓인다. 생략하면 고객사 합계만 (옛 호출 호환).

### 사이트 쪽에서 할 일
패키지만 올리면 타입은 통과하지만 값이 살지 않는다. `PopupManager`(디바이스 필터 · `popupId` 전달 · `dismissToday`) 와
`PopupWindow`(문구 영역) 를 템플릿(`bishu-client-template`) 기준으로 맞춘다.

## v0.10.0 — 2026-08-18

- **Breaking** Firebase 직접 모드 제거. 콘솔 API(`CMS_API_URL` · `CMS_API_KEY`) 전용 (N-04).
  `FIREBASE_SERVICE_ACCOUNT_KEY` 는 더 이상 읽지 않는다.

## v0.9.0 — 2026-08-06

- 첨부 필드가 둘 이상인 폼 지원 (`fieldId`).

## v0.8.0 — 2026-08-05

- 브라우저 → Storage 직행 업로드 `issueUploadUrls()` · `uploadFilesFromBrowser()` (`/client`) (M-40).

## v0.7.1 — 2026-08-05

- CSP `frame-ancestors` 지원 (기본 `'none'`).

## v0.7.0 — 2026-08-05

- `Post.viewCount` 노출.
