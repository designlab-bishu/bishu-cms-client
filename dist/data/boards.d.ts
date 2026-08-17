/**
 * 게시판 데이터 서버사이드 읽기 (콘솔 API 경유)
 * @module lib/data/boards
 *
 * 공개 조건(게시판 active·public, 게시글 published) 판정과 정렬은 콘솔이 한다.
 * 조회 실패 시 빈 값 — 콘솔 장애로 페이지 전체가 죽지 않게 한다.
 */
import type { Board, Post } from "../types.js";
export declare function fetchBoards(): Promise<Board[]>;
export declare function fetchBoardBySlug(slug: string): Promise<Board | null>;
export declare function fetchPosts(boardId: string): Promise<Post[]>;
export declare function fetchPost(boardId: string, postId: string): Promise<Post | null>;
