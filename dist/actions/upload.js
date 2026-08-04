import { randomUUID } from "crypto";
import { db, bucket, getCustomerId } from "../lib/config.js";
import { postToConsole, isApiMode } from "../lib/client.js";
/**
 * 브라우저에서 실행 가능한 타입(HTML/JS/SVG 등)을 배제한 화이트리스트.
 * console/storage.rules 의 isAllowedAttachment() 와 동일한 기준을 유지할 것.
 */
const ALLOWED_CONTENT_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "application/pdf",
    "application/zip",
    // 한글(HWP/HWPX) — 브라우저·OS별로 전송 타입이 제각각이다
    "application/x-hwp",
    "application/haansofthwp",
    "application/haansoftHWP",
    "application/vnd.hancom.hwp",
    "application/vnd.hancom.hwpx",
    // OS가 타입을 모르면 octet-stream 으로 올라온다. 브라우저가 렌더하지 않는다.
    "application/octet-stream",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
]);
/** 폼 정의의 accept 설정(확장자 또는 MIME)과 대조 */
function matchesAccept(accept, fileName, contentType) {
    if (!accept || accept.length === 0)
        return true;
    const ext = `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`;
    return accept.some((entry) => {
        const value = entry.trim().toLowerCase();
        if (!value)
            return false;
        if (value.startsWith("."))
            return ext === value;
        if (value.endsWith("/*"))
            return contentType.startsWith(value.slice(0, -1));
        return contentType === value;
    });
}
/**
 * 폼 첨부파일 업로드 Server Action
 *
 * 익명 방문자가 직접 호출할 수 있는 경로이므로 서버에서 전부 재검증한다.
 * 클라이언트 검증(FileFieldInput)은 UX 용도일 뿐 신뢰하지 않는다.
 */
async function directUploadFormFiles(formData) {
    const customerId = getCustomerId();
    try {
        const formId = formData.get("formId");
        const fieldId = formData.get("fieldId");
        const rawFiles = formData.getAll("files");
        if (!formId || !fieldId || rawFiles.length === 0) {
            return { success: false, error: "필수 데이터가 누락되었습니다." };
        }
        // ── 폼 정의 확인 ──
        const formSnap = await db()
            .doc(`customers/${customerId}/forms/${formId}`)
            .get();
        if (!formSnap.exists) {
            return { success: false, error: "폼을 찾을 수 없습니다." };
        }
        const form = formSnap.data();
        if (form.status !== "active") {
            return { success: false, error: "현재 접수할 수 없는 폼입니다." };
        }
        const field = (form.fields ?? []).find((f) => f.id === fieldId);
        if (!field || field.type !== "file") {
            return { success: false, error: "잘못된 첨부 필드입니다." };
        }
        const maxFiles = field.file?.maxFiles ?? 1;
        const maxSizeMB = field.file?.maxSizeMB ?? 10;
        const accept = field.file?.accept;
        // ── 서버측 검증 ──
        if (rawFiles.length > maxFiles) {
            return {
                success: false,
                error: `최대 ${maxFiles}개까지 업로드할 수 있습니다.`,
            };
        }
        for (const file of rawFiles) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                return {
                    success: false,
                    error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
                };
            }
            if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
                return { success: false, error: "허용되지 않는 파일 형식입니다." };
            }
            if (!matchesAccept(accept, file.name, file.type)) {
                return { success: false, error: "허용되지 않는 파일 형식입니다." };
            }
        }
        // ── 업로드 ──
        const store = bucket();
        const uploaded = [];
        for (const file of rawFiles) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = file.name.split(".").pop() || "";
            // uploads/ 이하로 저장한다. Storage 규칙(uploads/{cid}/forms/**)과
            // /api/download 프록시의 prefix 검증이 이 경로를 전제로 한다.
            const storagePath = `uploads/${customerId}/forms/${formId}/${fieldId}/${randomUUID()}.${ext}`;
            const fileRef = store.file(storagePath);
            await fileRef.save(buffer, {
                metadata: {
                    contentType: file.type,
                    metadata: { originalName: file.name },
                },
            });
            // 공개 ACL을 부여하지 않는다. 다운로드는 /api/download 프록시만 사용한다.
            uploaded.push({
                name: file.name,
                path: storagePath,
                size: file.size,
                contentType: file.type,
            });
        }
        return { success: true, files: uploaded };
    }
    catch (error) {
        console.error("File upload error:", error);
        return { success: false, error: "파일 업로드에 실패했습니다." };
    }
}
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
    if (!isApiMode())
        return directUploadFormFiles(formData);
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
