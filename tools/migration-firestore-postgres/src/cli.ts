import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Client } from 'pg'
import { checksum, deterministicUuid, docs, emptyManifest, readJson, writeJson } from './manifest.js'
import type { ManifestRecord, MigrationManifest, SourceDocument } from './types.js'

const [, , command, ...arguments_] = process.argv
const value = (name: string, fallback?: string) => { const index = arguments_.indexOf(name); return index >= 0 ? arguments_[index + 1] : fallback }
const required = (name: string) => value(name) ?? (() => { throw new Error(`${name} is required`) })()

async function transform(): Promise<void> {
  const input = required('--input'); const output = required('--output'); const source = await readJson<Record<string, SourceDocument[]> | { collections: Record<string, SourceDocument[]> }>(input); const manifest = emptyManifest(checksum(source));
  const add = (collection: string, document: SourceDocument, targetType: string, payload: Record<string, unknown>, targetId = deterministicUuid(`${collection}/${document.id}`)) => manifest.records.push({ sourceCollection: collection, sourceDocumentId: document.id, targetType, targetId, payload, checksum: checksum(payload) });
  for (const user of docs(source, 'users')) add('users', user, 'user', user.data);
  for (const practice of docs(source, 'practices')) {
    add('practices', practice, 'practice', practice.data);
    for (const member of practice.subcollections?.members ?? []) add(`practices/${practice.id}/members`, member, 'practice_member', { ...member.data, practiceId: practice.id });
    for (const invite of practice.subcollections?.invites ?? []) add(`practices/${practice.id}/invites`, invite, 'practice_invitation', { ...invite.data, practiceId: practice.id });
    for (const article of practice.subcollections?.articles ?? []) {
      add(`practices/${practice.id}/articles`, article, 'practice_page', { ...article.data, practiceId: practice.id, slug: article.data.slug ?? article.id });
      for (const note of article.subcollections?.notes ?? []) add(`practices/${practice.id}/articles/${article.id}/notes`, note, 'practice_page_section', { ...note.data, practiceId: practice.id });
    }
  }
  for (const state of docs(source, 'userState')) add('userState', state, 'user_preference', state.data);
  for (const article of docs(source, 'articles')) { add('articles', article, 'article', article.data); for (const note of article.subcollections?.notes ?? []) add(`articles/${article.id}/notes`, note, 'article_section', note.data); }
  await writeJson(output, manifest);
}

async function validateSource(): Promise<void> {
  const input = required('--input'); const output = required('--output'); const manifest = await readJson<MigrationManifest>(input); const seen = new Set<string>();
  for (const record of manifest.records) {
    const key = `${record.sourceCollection}/${record.sourceDocumentId}`;
    if (!seen.add(key)) manifest.errors.push({ code: 'duplicate_source_document', sourceDocumentId: key });
    if (JSON.stringify(record.payload).length > 2_000_000) manifest.errors.push({ code: 'editor_document_too_large', sourceDocumentId: key });
    if (record.targetType === 'practice_member' && typeof record.payload.practiceId !== 'string') manifest.errors.push({ code: 'missing_practice_reference', sourceDocumentId: key });
  }
  await writeJson(output, manifest); if (manifest.errors.length) process.exitCode = 2;
}

async function importManifest(): Promise<void> {
  const input = required('--input'); const manifest = await readJson<MigrationManifest>(input); const client = new Client({ connectionString: required('--database-url'), ssl: value('--ssl') === 'true' ? { rejectUnauthorized: true } : undefined }); await client.connect();
  try { await client.query('BEGIN'); await client.query('CREATE TABLE IF NOT EXISTS migration_runs (run_id uuid primary key, source_checksum text not null, started_at timestamptz not null, status text not null)'); await client.query('INSERT INTO migration_runs(run_id, source_checksum, started_at, status) VALUES ($1,$2,$3,$4) ON CONFLICT (run_id) DO NOTHING', [manifest.runId, manifest.sourceChecksum, manifest.sourceExportTimestamp, 'running']);
    for (const record of manifest.records) await client.query('INSERT INTO migration_aliases(id, source_system, source_document_id, target_type, target_id, migration_run_id, checksum, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT (source_system, source_document_id) DO UPDATE SET checksum=excluded.checksum, migration_run_id=excluded.migration_run_id', [randomUUID(), 'firestore', `${record.sourceCollection}/${record.sourceDocumentId}`, record.targetType, record.targetId, manifest.runId, record.checksum]);
    await client.query('UPDATE migration_runs SET status=$2 WHERE run_id=$1', [manifest.runId, 'aliases-recorded']); await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.end(); }
}

async function validateTarget(): Promise<void> {
  const input = required('--input'); const output = required('--output'); const manifest = await readJson<MigrationManifest>(input); const client = new Client({ connectionString: required('--database-url') }); await client.connect();
  try { const result = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM migration_aliases WHERE migration_run_id=$1', [manifest.runId]); await writeJson(output, { runId: manifest.runId, sourceRecords: manifest.records.length, aliasRecords: Number(result.rows[0].count), reconciled: Number(result.rows[0].count) === manifest.records.length }); } finally { await client.end(); }
}

async function report(): Promise<void> { const input = required('--input'); const output = required('--output'); const manifest = await readJson<MigrationManifest>(input); const recordCounts = manifest.records.reduce<Record<string, number>>((counts, record) => { counts[record.targetType] = (counts[record.targetType] ?? 0) + 1; return counts }, {}); await writeJson(output, { runId: manifest.runId, sourceExportTimestamp: manifest.sourceExportTimestamp, sourceChecksum: manifest.sourceChecksum, recordCounts, errorCodes: manifest.errors.map(error => error.code), sensitivePayloadsOmitted: true }); }
async function exportSource(): Promise<void> { const input = required('--input'); const output = required('--output'); await readFile(input).then(data => writeJson(output, { sourceExportTimestamp: new Date().toISOString(), sourceChecksum: checksum(data.toString()), snapshot: JSON.parse(data.toString()) })); }

const commands: Record<string, () => Promise<void>> = { transform, 'validate-source': validateSource, import: importManifest, 'validate-target': validateTarget, report, export: exportSource };
if (!commands[command]) throw new Error(`Unknown command ${command}`); await commands[command]()
