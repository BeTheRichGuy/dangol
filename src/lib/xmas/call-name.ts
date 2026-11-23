export function callName(name: string): string {
  const n = name.trim();
  return /^[가-힣]{3}$/.test(n) ? n.slice(1) : n;
}
