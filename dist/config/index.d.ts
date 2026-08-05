/**
 * @designlab-bishu/cms-client/config
 *
 * 빌드 설정용 진입점. `next.config.ts` 에서 import 한다.
 * Firebase·React 를 끌어오지 않으므로 설정 파일에서 안전하게 쓸 수 있다.
 */
export { securityHeaders, buildCsp } from "./security-headers.js";
export type { SecurityHeadersOptions } from "./security-headers.js";
