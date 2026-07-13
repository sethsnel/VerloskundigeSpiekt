import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalJson, checksum, emptyManifest } from '../src/manifest.js'

test('property order at every depth does not affect checksums', () => {
  assert.equal(checksum({ z: [{ b: 2, a: 1 }], a: true }), checksum({ a: true, z: [{ a: 1, b: 2 }] }))
})

test('nested changes affect checksums', () => {
  assert.notEqual(checksum({ collections: [{ nested: { value: 1 } }] }), checksum({ collections: [{ nested: { value: 2 } }] }))
})

test('canonical normalization handles undefined, maps, arrays, and timestamps', () => {
  assert.equal(canonicalJson({ missing: undefined, values: [undefined], map: new Map([['b', 2], ['a', 1]]), at: new Date('2026-01-01T00:00:00Z') }), '{"at":"2026-01-01T00:00:00.000Z","map":{"a":1,"b":2},"values":[null]}')
})

test('run id is stable for a source checksum and algorithm is versioned', () => {
  const first = emptyManifest('abc'); const second = emptyManifest('abc')
  assert.equal(first.runId, second.runId)
  assert.equal(first.checksumAlgorithm, 'canonical-json-sha256-v1')
})
