# @designlab-bishu/cms-client

고객사 사이트가 **BISHU 클라이언트 콘솔(CMS)** 에 연결하기 위한 배관 계층.

> **디자인은 사이트가, 데이터·보안은 이 패키지가 담당한다.**
> 피그마 기반 개별 구현은 그대로 두고, 매번 손으로 짜던 CMS 연동만 대체한다.

## 왜 만들었나

고객사 사이트마다 CMS 연동 코드를 손으로 작성해왔다. 그 결과 같은 보안 취약점을 저장소 여러 곳에 각각 이식해야 했고, 구조가 갈라져 단순 복사도 불가능했다.

배관 층의 실수는 **화면에 드러나지 않는다.** 파일이 공개 URL로 저장돼도 화면은 정상이고, 서버 검증이 없어도 일반 사용자는 아무것도 느끼지 못한다. 매번 손으로 구현하는 한 숙련도와 무관하게 누락이 발생한다.

배경과 대안 검토는 볼트의 [ADR: 고객사 사이트 CMS 연동 패키지화] 참조.

## 설치

GitHub Packages 에 비공개로 배포된다. 설치하려면 프로젝트 루트에 `.npmrc` 가 필요하다.

```
# .npmrc
@designlab-bishu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @designlab-bishu/cms-client
```

> `GITHUB_TOKEN` 은 `read:packages` 스코프를 가진 개인 액세스 토큰이다.
> Vercel 배포 시에는 환경변수로 등록해야 빌드가 통과한다.

## 환경변수

```bash
CUSTOMER_ID=changchanghan            # 콘솔에서 발급한 고객사 ID
FIREBASE_SERVICE_ACCOUNT_KEY={...}   # 서비스 계정 JSON
```

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

## API

| 구분 | 함수 |
|---|---|
| 게시판 | `fetchBoards()` · `fetchBoardBySlug(slug)` · `fetchPosts(boardId)` · `fetchPost(boardId, postId)` |
| 폼 | `fetchFormBySlug(slug)` · `createSubmission(formId, values, meta?)` · `uploadFormFiles(formData)` |
| 팝업 | `fetchActivePopups()` · `trackPopupEvent(type)` |
| 예약 | `fetchReservationsByMonth(year, month)` · `fetchReservationsByDate(dateStr)` |
| 집계 | `incrementPostViewCount(boardId, postId)` |
| 유틸 | `sanitizeCmsHtml(html)` · `maskName(name)` · `getCustomerId()` |

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
- 버전을 올려도 **각 사이트가 재배포해야 반영된다.** 자동이 아니다
- 첨부 다운로드 라우트(`/api/download`)는 사이트에 있어야 하므로 패키지에 포함되지 않는다

## 배포

```bash
# 버전 올리고 태그 푸시하면 GitHub Actions 가 배포한다
npm version patch
git push --follow-tags
```
