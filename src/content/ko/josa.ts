export function hasBatchim(word: string): boolean {
  const code = word.trim().slice(-1).charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

export const iya = (word: string) => `${word}${hasBatchim(word) ? '이야' : '야'}`;

export const irae = (word: string) => `${word}${hasBatchim(word) ? '이래' : '래'}`;
