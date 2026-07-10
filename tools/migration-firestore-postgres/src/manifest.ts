import { createHash, randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import type { MigrationManifest, SourceDocument } from './types.js'

export async function readJson<T>(path: string): Promise<T> { return JSON.parse(await readFile(path, 'utf8')) as T }
export async function writeJson(path: string, value: unknown): Promise<void> { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }
export function checksum(value: unknown): string { return createHash('sha256').update(JSON.stringify(value, Object.keys(value as object).sort())).digest('hex') }
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
export function emptyManifest(sourceChecksum: string): MigrationManifest { return { runId: randomUUID(), sourceExportTimestamp: new Date().toISOString(), sourceChecksum, toolVersion: '1.0.0', records: [], errors: [] } }
