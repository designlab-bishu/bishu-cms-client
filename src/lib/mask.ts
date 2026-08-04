/**
 * 개인정보 마스킹
 * @module lib/mask
 *
 * 예약자 이름 등 고객 사이트에 노출되는 개인정보를 가린다.
 */

export function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}
