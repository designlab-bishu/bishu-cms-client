/**
 * 폼 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/forms
 *
 * 제출은 `actions/submit.ts` 의 `createSubmission` 을 쓴다.
 * v0.10.0 이전에는 이 파일에도 같은 이름의 함수가 있었는데, 패키지가
 * 내보내는 것은 `actions/submit` 쪽이었고 이쪽은 아무도 부르지 않는
 * Firebase 직접 접근 구현이었다. 중복을 남기면 어느 쪽이 도는지 헷갈린다.
 */
import { fetchFromConsole } from "../lib/client.js";
export async function fetchFormBySlug(slug) {
    const r = await fetchFromConsole({
        resource: "form",
        slug: String(slug),
    });
    return r?.form ?? null;
}
