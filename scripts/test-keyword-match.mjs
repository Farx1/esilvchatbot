// Run: node --experimental-strip-types --no-warnings scripts/test-keyword-match.mjs
import assert from 'node:assert/strict'
import { hasKeyword } from '../src/lib/keyword-match.ts'

assert.equal(hasKeyword('Quel est le nombre d\'étudiants ?', ['nom']), false)
assert.equal(hasKeyword('Mon nom est Jules', ['nom']), true)
assert.equal(hasKeyword('Les informations sur les cours', ['information']), true) // plural
assert.equal(hasKeyword('Je cherche une ecole', ['école']), true) // accent-insensitive
assert.equal(hasKeyword("C'est où l'ÉCOLE ?", ['école']), true)
assert.equal(hasKeyword('Les débouchés', ['débouché']), true)
assert.equal(hasKeyword('Prendre rendez-vous', ['rendez-vous']), true)
assert.equal(hasKeyword('Le laboratoire', ['lab']), false)
assert.equal(hasKeyword('emails', ['email']), true)
assert.equal(hasKeyword('', ['nom']), false)
console.log('OK keyword-match')
