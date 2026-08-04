/**
 * 게시판 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/boards
 *
 * Firestore 경로:
 *   Board: customers/{customerId}/boards/{boardId}
 *   Post:  customers/{customerId}/boards/{boardId}/posts/{postId}
 */
import type { Board, Post } from "../types.js";
/**
 * 공개 게시판 목록 조회 (active + public만)
 */
export declare function fetchBoards(): Promise<Board[]>;
/**
 * slug로 게시판 조회 (active + public만)
 */
export declare function fetchBoardBySlug(slug: string): Promise<(Board & {
    boardId: string;
}) | null>;
/**
 * 게시글 목록 조회 (published만)
 */
export declare function fetchPosts(boardId: string): Promise<Post[]>;
/**
 * 게시글 단건 조회 (published만)
 */
export declare function fetchPost(boardId: string, postId: string): Promise<Post | null>;
