# @designlab-bishu/cms-client

고객사 사이트가 **BISHU 클라이언트 콘솔(CMS)** 에 연결하기 위한 배관 계층.

> **디자인은 사이트가, 데이터·보안은 이 패키지가 담당한다.**
> 피그마 기반 개별 구현은 그대로 두고, 매번 손으로 짜던 CMS 연동만 대체한다.

## 왜 만들었나

고객사 사이트마다 CMS 연동 코드를 손으로 작성해왔다. 그 결과 같은 보안 취약점을 저장소 여러 곳에 각각 이식해야 했고, 구조가 갈라져 단순 복사도 불가능했다.

배관 층의 실수는 **화면에 드러나지 않는다.** 파일이 공개 URL로 저장돼도 화면은 정상이고, 서버 검증이 없어도 일반 사용자는 아무것도 느끼지 못한다. 매번 손으로 구현하는 한 숙련도와 무관하게 누락이 발생한다.

배경과 대안 검토는 볼트의 [ADR: 고객사 사이트 CMS 연동 패키지화] 참조.

## 설치

git 의존성으로 설치한다. 버전은 **항상 태그로 고정**한다 — 토큰·npm 계정이 필요 없다.

```bash
npm install "github:designlab-bishu/bishu-cms-client#v0.13.0"
```

`dist/` 가 저장소에 포함돼 있어 설치 시 빌드가 돌지 않는다. 버전을 올려도 **각 사이트가
태그를 바꿔 재설치·재배포해야 반영된다.** 변경 내역은 [CHANGELOG.md](CHANGELOG.md).

## 환경변수

```bash
CUSTOMER_ID=changchanghan                        # 콘솔에서 발급한 고객사 ID
CMS_API_URL=https://console.designlab-bishu.com  # 콘솔 주소
CMS_API_KEY=bcs_...                              # 고객사 API 키 (콘솔 → 고객사 관리에서 발급)
```

콘솔 API 로만 통신한다 (v0.10.0~). Firebase 서비스 계정 키는 넣지 않는다.

## 사용

### 조회 (서버 컴포넌트)

```tsx
import { fetchPosts, sanitizeCmsHtml, type Post } from "@designlab-bishu/cms-client";

export default async function NoticePage() {
  const posts = await fetchPosts("notice");   // 배관: 패키지
  return <MyDesign posts={posts} />;          // 디자인: 사이트
}
```

`customerId` 를 인자로 받지 않는다. 패키지가 환경변수에서 한 번만 읽는다.
호출부가 값을 잘못 넘겨 다른 고객사 경로에 쓰거나, 임의 문자열이 저장 경로로 흘러드는 사고를 구조적으로 막기 위해서다.

### 쓰기 (Server Action)

패키지는 **순수 async 함수만** 제공한다. `"use server"` 경계는 사이트가 소유한다.

```ts
// src/lib/cms-actions.ts
"use server";

import { uploadFormFiles as core } from "@designlab-bishu/cms-client";

export async function uploadFormFiles(formData: FormData) {
  return core(formData);
}
```

이렇게 두면 ① 어떤 동작을 브라우저에 노출할지 사이트가 통제하고 ② 제출 전 검증·알림 같은 커스터마이즈 지점이 생기며 ③ 번들러 엣지 케이스를 피한다.

### 본문 렌더

게시글 본문은 CMS 에서 HTML 로 온다. **반드시 정제 후 렌더할 것.**

```tsx
<div dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(post.content) }} />
```

### 보안 헤더 (next.config.ts)

CSP 는 "여기서 오는 코드만 실행하라"는 브라우저 명단이다. CMS 기능을 붙일 때마다
항목이 늘어나므로 사이트마다 손으로 관리하지 않는다.

```ts
// next.config.ts
import type { NextConfig } from "next";
import { securityHeaders } from "@designlab-bishu/cms-client/config";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};
```

콘솔 오리진·GA4·Firebase Storage 도메인이 기본으로 들어간다. 사이트 고유 리소스는
인자로 넓힌다.

```ts
securityHeaders({
  frameSrc: ["https://www.youtube.com"],   // 유튜브 임베드
  scriptSrc: ["https://maps.googleapis.com"],
  frameOptions: "SAMEORIGIN",
})
```

> **명단에서 빠지면 브라우저가 조용히 차단한다.** 에러도, 화면 표시도 없다.
> 콘솔에서 기능을 켰는데 사이트에 안 뜨면 여기를 먼저 본다.
> (2026-08-05 studio-bishu: 챗봇을 켰으나 CSP 에 콘솔이 없어 차단됨)

## API

| 구분 | 함수 |
|---|---|
| 게시판 | `fetchBoards()` · `fetchBoardBySlug(slug)` · `fetchPosts(boardId)` · `fetchPost(boardId, postId)` |
| 폼 | `fetchFormBySlug(slug)` · `createSubmission(formId, values, meta?)` · `uploadFormFiles(formData)` |
| 팝업 | `fetchActivePopups()` · `trackPopupEvent(type, popupId?)` |
| 예약 | `fetchReservationsByMonth(year, month)` · `fetchReservationsByDate(dateStr)` |
| 집계 | `incrementPostViewCount(boardId, postId)` |
| 유틸 | `sanitizeCmsHtml(html)` · `maskName(name)` · `getCustomerId()` |
| 설정 (`/config`) | `securityHeaders(options?)` · `buildCsp(options?)` |

타입: `Board` `Post` `Form` `FormField` `Popup` `Reservation` `FileAttachment` `UploadedFile` 외

## 포함된 보안 로직

손으로 구현할 때 자주 누락되던 것들이 기본으로 들어있다.

- 폼 첨부 업로드 — 폼 존재·활성 확인, 필드별 개수·크기·확장자 재검증, MIME 화이트리스트(HTML/JS/SVG 차단)
- 공개 ACL 미부여 — 첨부는 공개 URL 을 갖지 않는다. 조회는 인증된 경로로만
- 저장 경로 고정 — `uploads/{customerId}/...`. 요청자가 경로를 정할 수 없다
- 본문 정제 — `script`·이벤트 핸들러·`javascript:` 스킴 차단
- 예약자 이름 마스킹

## 주의

- **서버 전용.** 클라이언트 컴포넌트(`"use client"`)에서 import 하지 말 것
  - 예외: `/client` (위젯 컴포넌트), `/config` (빌드 설정)
- `"use server"` 파일에서 **타입을 재수출하지 말 것.** 서버 액션 변환기가 런타임
  바인딩을 만들어 `ReferenceError` 가 난다. 빌드는 통과하고 런타임에만 재현된다
  ```ts
  import type { X } from "pkg"; export type { X };   // ✗
  export type { X } from "pkg";                      // ○
  ```
- 버전을 올려도 **각 사이트가 재배포해야 반영된다.** 자동이 아니다
- 첨부 다운로드 라우트(`/api/download`)는 사이트에 있어야 하므로 패키지에 포함되지 않는다

## 배포

```bash
# dist 를 다시 빌드해 커밋하고, 버전 태그를 푸시한다
npm run build
npm version minor        # 또는 patch
git push --follow-tags
```

사이트는 `#vX.Y.Z` 태그로 설치하므로 **태그가 없으면 설치되지 않는다.**
