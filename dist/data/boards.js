/**
 * 게시판 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/boards
 *
 * Firestore 경로:
 *   Board: customers/{customerId}/boards/{boardId}
 *   Post:  customers/{customerId}/boards/{boardId}/posts/{postId}
 */
import { db, getCustomerId } from "../lib/config.js";
/**
 * 공개 게시판 목록 조회 (active + public만)
 */
export async function fetchBoards() {
    const snap = await db()
        .collection("customers")
        .doc(getCustomerId())
        .collection("boards")
        .where("status", "==", "active")
        .where("visibility", "==", "public")
        .orderBy("updatedAt", "desc")
        .get();
    return snap.docs.map((doc) => {
        const data = doc.data();
        return {
            boardId: data.boardId,
            name: data.name,
            slug: data.slug,
            viewType: data.viewType,
            categories: data.categories ?? [],
        };
    });
}
/**
 * slug로 게시판 조회 (active + public만)
 */
export async function fetchBoardBySlug(slug) {
    const snap = await db()
        .collection("customers")
        .doc(getCustomerId())
        .collection("boards")
        .where("slug", "==", slug)
        .where("status", "==", "active")
        .where("visibility", "==", "public")
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const data = snap.docs[0].data();
    return {
        boardId: data.boardId,
        name: data.name,
        slug: data.slug,
        viewType: data.viewType,
        categories: data.categories ?? [],
    };
}
/**
 * 게시글 목록 조회 (published만)
 */
export async function fetchPosts(boardId) {
    const snap = await db()
        .collection("customers")
        .doc(getCustomerId())
        .collection("boards")
        .doc(boardId)
        .collection("posts")
        .where("status", "==", "published")
        .orderBy("isPinned", "desc")
        .orderBy("createdAt", "desc")
        .get();
    return snap.docs.map((doc) => serializePost(doc.data()));
}
/**
 * 게시글 단건 조회 (published만)
 */
export async function fetchPost(boardId, postId) {
    const docSnap = await db()
        .collection("customers")
        .doc(getCustomerId())
        .collection("boards")
        .doc(boardId)
        .collection("posts")
        .doc(postId)
        .get();
    if (!docSnap.exists)
        return null;
    const data = docSnap.data();
    if (data.status !== "published")
        return null;
    return serializePost(data);
}
function serializePost(data) {
    return {
        postId: data.postId,
        title: data.title,
        category: data.category,
        contentType: data.contentType,
        content: data.content,
        isPinned: data.isPinned ?? false,
        isNotice: data.isNotice ?? false,
        thumbnail: data.thumbnail
            ? {
                url: data.thumbnail.url,
                width: data.thumbnail.width,
                height: data.thumbnail.height,
                alt: data.thumbnail.alt,
            }
            : undefined,
        attachments: data.attachments?.map((a) => ({
            name: a.name,
            url: a.url,
            path: a.path,
            size: a.size,
            contentType: a.contentType,
        })),
        author: { displayName: data.author?.displayName ?? "" },
        publishedAt: data.publishedAt
            ? data.publishedAt.toDate().toISOString()
            : null,
        createdAt: data.createdAt.toDate().toISOString(),
    };
}
