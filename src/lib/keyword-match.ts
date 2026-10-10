// Whole-word keyword match, accent- and case-insensitive ("nom" must not match "nombre", "ecole" matches "école").
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// shortcut: only plural s/x is tolerated, no stemming; use a real tokenizer/stemmer if routing needs more recall
export function hasKeyword(message: string, keywords: string[]): boolean {
  const text = fold(message)
  return keywords.some(k => new RegExp(`\\b${escapeRegExp(fold(k))}[sx]?\\b`).test(text))
}
