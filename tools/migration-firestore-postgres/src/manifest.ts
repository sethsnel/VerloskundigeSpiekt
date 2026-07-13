import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import type { MigrationManifest, SourceDocument } from './types.js'

export async function readJson<T>(path: string): Promise<T> { return JSON.parse(await readFile(path, 'utf8')) as T }
export async function writeJson(path: string, value: unknown): Promise<void> { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }
export const checksumAlgorithm = 'canonical-json-sha256-v1' as const

/** Canonical JSON: object keys are recursively sorted; arrays retain order;
 * undefined object properties are omitted and undefined array values become
 * null, matching JSON. Dates/Firestore Timestamp-like values normalize to an
 * ISO string. Non-finite numbers and unsupported cyclic values are rejected. */
export function canonicalJson(value: unknown): string {
  const seen = new Set<object>()
  const normalize = (item: unknown, inArray = false): unknown => {
    if (item === undefined) return inArray ? null : undefined
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return item
    if (typeof item === 'number') { if (!Number.isFinite(item)) throw new TypeError('Canonical JSON rejects non-finite numbers'); return item }
    if (typeof item === 'bigint' || typeof item === 'function' || typeof item === 'symbol') throw new TypeError(`Canonical JSON rejects ${typeof item}`)
    if (item instanceof Date) return item.toISOString()
    if (typeof item === 'object') {
      const timestamp = item as { toDate?: () => Date }
      if (typeof timestamp.toDate === 'function') return timestamp.toDate().toISOString()
      if (seen.has(item)) throw new TypeError('Canonical JSON rejects cyclic values')
      seen.add(item)
      let result: unknown
      if (Array.isArray(item)) result = item.map(entry => normalize(entry, true))
      else if (item instanceof Map) result = Object.fromEntries(([...item.entries()] as [unknown, unknown][]).map(([key, entry]): [string, unknown] => [String(key), normalize(entry)]).sort(([a], [b]) => a.localeCompare(b)))
      else result = Object.fromEntries(Object.keys(item).sort().flatMap(key => { const normalized = normalize((item as Record<string, unknown>)[key]); return normalized === undefined ? [] : [[key, normalized]] }))
      seen.delete(item)
      return result
    }
    throw new TypeError('Unsupported canonical JSON value')
  }
  return JSON.stringify(normalize(value))
}
export function checksum(value: unknown): string { return createHash('sha256').update(canonicalJson(value)).digest('hex') }
export function deterministicUuid(value: string): string {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
export function docs(snapshot: Record<string, SourceDocument[]> | { collections?: Record<string, SourceDocument[]> }, collection: string): SourceDocument[] {
  if (Object.prototype.hasOwnProperty.call(snapshot, 'collections')) return (snapshot as { collections?: Record<string, SourceDocument[]> }).collections?.[collection] ?? []
  return (snapshot as Record<string, SourceDocument[]>)[collection] ?? []
}
export function emptyManifest(sourceChecksum: string): MigrationManifest { return { runId: deterministicUuid(`${checksumAlgorithm}:${sourceChecksum}`), sourceExportTimestamp: new Date().toISOString(), sourceChecksum, checksumAlgorithm, toolVersion: '1.1.0', schemaVersion: 1, records: [], errors: [] } }
