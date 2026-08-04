/**
 * 게시판 데이터 서버사이드 읽기 (firebase-admin)
 * @module lib/data/boards
 *
 * Firestore 경로:
 *   Board: customers/{customerId}/boards/{boardId}
 *   Post:  customers/{customerId}/boards/{boardId}/posts/{postId}
 */
import type { Board, Post } from "../types.js";
export declare function fetchBoards(): Promise<Board[]>;
export declare function fetchBoardBySlug(slug: string): Promise<Board | null>;
export declare function fetchPosts(boardId: string): Promise<Post[]>;
export declare function fetchPost(boardId: string, postId: string): Promise<Post | null>;
