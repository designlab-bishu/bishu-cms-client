/**
 * 첨부 다운로드 URL
 * @module actions/download
 *
 * 콘솔이 경로 소유권을 검증하고 5분짜리 서명 URL 을 발급한다.
 * 파일은 Storage 에서 직접 내려가므로 콘솔도 사이트도 바이트를 중계하지 않는다.
 *
 * 허용 경로는 콘솔의 `issueDownloadUrl` 이 판정한다 —
 * `uploads/{cid}/` 와 `customers/{cid}/forms/`(구 경로), 그리고 `..` 차단.
 * v0.10.0 이전에는 같은 검사를 이 파일에서도 했는데, 두 벌을 유지하면
 * 어긋난다. 소유권 판정은 콘솔 한 곳에만 둔다.
 */
import { postToConsole } from "../lib/client.js";
/**
 * @returns 서명 URL. 실패 시 null — 호출부가 404 등으로 처리한다.
 */
export async function getAttachmentUrl(path) {
    const res = await postToConsole({
        action: "downloadUrl",
        path,
    });
    return res.ok ? res.data.url : null;
}
