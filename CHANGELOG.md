# Changelog

사이트는 `github:designlab-bishu/bishu-cms-client#vX.Y.Z` 태그로 설치한다.
응답 형태는 **더하기만 하고 빼지 않는다** (콘솔 API-P-30) — minor 올림은 사이트 코드를 고치지 않아도 동작한다.

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
`src/app/boards/[boardSlug]/page.tsx`(`?page=N` 슬라이스) 와 `src/components/boards/Pagination.tsx` 를 맞춘다.

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
