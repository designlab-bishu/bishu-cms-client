/**
 * 게시판 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/boards
 *
 * 공개 조건(게시판 active·public, 게시글 published) 판정과 정렬은 콘솔이 한다.
 * 조회 실패 시 빈 값 — 콘솔 장애로 페이지 전체가 죽지 않게 한다.
 */
import { fetchFromConsole } from "../lib/client.js";
export async function fetchBoards() {
    const r = await fetchFromConsole({ resource: "boards" });
    return r?.boards ?? [];
}
export async function fetchBoardBySlug(slug) {
    const r = await fetchFromConsole({
        resource: "board",
        slug: String(slug),
    });
    return r?.board ?? null;
}
export async function fetchPosts(boardId) {
    const r = await fetchFromConsole({
        resource: "posts",
        boardId: String(boardId),
    });
    return r?.posts ?? [];
}
export async function fetchPost(boardId, postId) {
    const r = await fetchFromConsole({
        resource: "post",
        boardId: String(boardId),
        postId: String(postId),
    });
    return r?.post ?? null;
}
