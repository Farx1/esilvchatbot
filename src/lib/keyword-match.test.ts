import { describe, expect, it } from 'vitest'
import { hasKeyword } from './keyword-match'

describe('hasKeyword', () => {
  it.each([
    ["Quel est le nombre d'étudiants ?", ['nom'], false], // whole word only
    ['Mon nom est Jules', ['nom'], true],
    ['Les informations sur les cours', ['information'], true], // plural
    ['Je cherche une ecole', ['école'], true], // accent-insensitive
    ["C'est où l'ÉCOLE ?", ['école'], true], // case-insensitive
    ['Les débouchés', ['débouché'], true],
    ['Prendre rendez-vous', ['rendez-vous'], true],
    ['Le laboratoire', ['lab'], false],
    ['emails', ['email'], true],
    ['', ['nom'], false],
  ] as const)('%j with %j -> %s', (message, keywords, expected) => {
    expect(hasKeyword(message, [...keywords])).toBe(expected)
  })
})
