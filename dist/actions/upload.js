/**
 * 폼 첨부 업로드
 * @module actions/upload
 *
 * 콘솔이 폼·필드를 조회해 업로드 URL 을 발급하고, 브라우저나 서버가 그 URL 로
 * 직접 올린다. **형식·크기·개수 검증은 전부 콘솔이 한다** —
 * 허용 MIME 화이트리스트와 폼별 accept·maxSizeMB 가 콘솔에 있다.
 *
 * v0.10.0 이전에는 같은 검증 목록을 이 파일도 들고 Firebase 에 직접 올렸다.
 * 두 벌을 유지하면 어긋나고, 무엇보다 그 경로가 마스터 키를 요구했다 (M-04).
 */
import { postToConsole } from "../lib/client.js";
/**
 * 폼 첨부 업로드.
 *
 * API 모드에서는 콘솔이 **검증과 경로 결정만** 하고 서명 URL 을 발급한다.
 * 파일 자체는 콘솔을 통과하지 않는다 — Vercel 요청 본문 한도(4.5MB)에 걸리고,
 * 콘솔이 대용량 전송을 중계할 이유도 없다.
 *
 * @param formSlug 폼 슬러그. 문서 ID·필드 ID 는 콘솔이 조회해서 정한다.
 */
export async function uploadFormFiles(formData) {
    const formSlug = formData.get("formId") || "";
    const rawFiles = formData.getAll("files");
    if (!formSlug || rawFiles.length === 0) {
        return { success: false, error: "필수 데이터가 누락되었습니다." };
    }
    const uploaded = [];
    for (const file of rawFiles) {
        const issued = await postToConsole({
            action: "uploadUrl",
            formSlug,
            fileName: file.name,
            contentType: file.type,
            size: file.size,
        });
        if (!issued.ok) {
            // 콘솔이 거부한 사유를 사용자에게 이해 가능한 문구로 바꾼다.
            const reason = issued.reason;
            if (reason.includes("file_too_large")) {
                return { success: false, error: "파일 크기가 허용 범위를 초과했습니다." };
            }
            if (reason.includes("content_type_not_allowed")) {
                return { success: false, error: "허용되지 않는 파일 형식입니다." };
            }
            return { success: false, error: "파일 업로드에 실패했습니다." };
        }
        const put = await fetch(issued.data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: await file.arrayBuffer(),
        });
        if (!put.ok) {
            console.error(`[cms-client] Storage 업로드 실패 ${put.status}`);
            return { success: false, error: "파일 업로드에 실패했습니다." };
        }
        uploaded.push({
            name: file.name,
            path: issued.data.path,
            size: file.size,
            contentType: file.type,
        });
    }
    return { success: true, files: uploaded };
}
/**
 * 브라우저가 Storage 로 직접 PUT 할 서명 URL 을 발급받는다.
 *
 * 사이트의 `"use server"` 파일에서 그대로 재수출해 클라이언트에 노출한다.
 * 파일 자체는 **서버를 거치지 않는다** — uploadFormFiles() 와 달리
 * Next 의 Server Action 본문 한도(기본 1MB)에 걸리지 않는다.
 *
 * 검증(형식·크기·개수)과 저장 경로는 콘솔이 정한다. 사이트가 보낸 값은
 * 슬러그와 파일 메타뿐이다.
 */
export async function issueUploadUrls(formSlug, files, 
/**
 * 첨부 필드 ID. 파일 필드가 둘 이상인 폼(이력서 + 포트폴리오 등)에서 지정한다.
 * 생략하면 콘솔이 첫 번째 파일 필드를 쓴다.
 */
fieldId) {
    if (!formSlug || files.length === 0) {
        return { success: false, error: "필수 데이터가 누락되었습니다." };
    }
    const tickets = [];
    for (const file of files) {
        const issued = await postToConsole({
            action: "uploadUrl",
            formSlug,
            fileName: file.name,
            contentType: file.contentType,
            size: file.size,
            ...(fieldId ? { fieldId } : {}),
        });
        if (!issued.ok) {
            const reason = issued.reason;
            if (reason.includes("file_too_large")) {
                return { success: false, error: "파일 크기가 허용 범위를 초과했습니다." };
            }
            if (reason.includes("content_type_not_allowed")) {
                return { success: false, error: "허용되지 않는 파일 형식입니다." };
            }
            return { success: false, error: "파일 업로드를 시작하지 못했습니다." };
        }
        tickets.push({ ...file, ...issued.data });
    }
    return { success: true, tickets };
}
