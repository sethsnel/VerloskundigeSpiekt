import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { Client } from 'pg'
import { checksum, deterministicUuid, docs, emptyManifest, readJson, writeJson } from './manifest.js'
import type { ManifestRecord, MigrationManifest, SourceDocument } from './types.js'

const [, , command, ...arguments_] = process.argv
const value = (name: string, fallback?: string) => { const index = arguments_.indexOf(name); return index >= 0 ? arguments_[index + 1] : fallback }
const required = (name: string) => value(name) ?? (() => { throw new Error(`${name} is required`) })()

async function loadEnvFile(path: string): Promise<void> {
  const lines = (await readFile(path, 'utf8')).split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key] = match
    let rawValue = match[2]
    if ((rawValue.startsWith('"') && !rawValue.endsWith('"')) || (rawValue.startsWith('-----BEGIN PRIVATE KEY-----') && !rawValue.endsWith('-----END PRIVATE KEY-----'))) {
      const quoted = rawValue.startsWith('"')
      const parts = [quoted ? rawValue.slice(1) : rawValue]
      while (++index < lines.length) {
        const part = lines[index]
        if (quoted && part.endsWith('"')) { parts.push(part.slice(0, -1)); break }
        if (part.endsWith('-----END PRIVATE KEY-----')) { parts.push(part); break }
        parts.push(part)
      }
      rawValue = parts.join('\n')
    } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      rawValue = rawValue.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = rawValue.replaceAll('\\n', '\n')
  }
}

async function snapshotDocument(document: QueryDocumentSnapshot): Promise<SourceDocument> {
  const subcollections: Record<string, SourceDocument[]> = {}
  for (const collection of await document.ref.listCollections()) {
    subcollections[collection.id] = await Promise.all((await collection.get()).docs.map(snapshot => snapshotDocument(snapshot)))
  }
  return { id: document.id, data: JSON.parse(JSON.stringify(document.data())), subcollections }
}

async function snapshotFirestore(): Promise<Record<string, SourceDocument[]>> {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !privateKey) throw new Error('FIREBASE_PROJECT_ID/NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required')
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  const database = getFirestore(app)
  const snapshot: Record<string, SourceDocument[]> = {}
  for (const collection of await database.listCollections()) snapshot[collection.id] = await Promise.all((await collection.get()).docs.map(document => snapshotDocument(document)))
  const users: SourceDocument[] = []
  let pageToken: string | undefined
  do {
    const page = await getAuth(app).listUsers(1000, pageToken)
    users.push(...page.users.map(user => ({ id: user.uid, data: { email: user.email ?? null, displayName: user.displayName ?? null, emailVerified: user.emailVerified, isGlobalAdministrator: user.customClaims?.admin === true || user.customClaims?.globalAdministrator === true } })))
    pageToken = page.pageToken
  } while (pageToken)
  snapshot.users = users
  return snapshot
}

function embeddedNotes(data: Record<string, unknown>): Array<[string, Record<string, unknown>]> {
  if (!data.notes || typeof data.notes !== 'object' || Array.isArray(data.notes)) return []
  return Object.entries(data.notes).filter((entry): entry is [string, Record<string, unknown>] => typeof entry[1] === 'object' && entry[1] !== null && !Array.isArray(entry[1]))
}

function editorDocument(note: Record<string, unknown>): unknown[] {
  if (Array.isArray(note.json)) return note.json
  if (typeof note.text === 'string' && note.text.length > 0) return [{ type: 'paragraph', children: [{ text: note.text }] }]
  return []
}

function textValue(value: unknown): string | null { return typeof value === 'string' ? value : null }

async function transform(): Promise<void> {
  type FirestoreSource = Record<string, SourceDocument[]> | { collections: Record<string, SourceDocument[]> }
  type ExportEnvelope = { sourceExportTimestamp: string; sourceChecksum: string; snapshot: Record<string, SourceDocument[]> }
  const input = required('--input'); const output = required('--output'); const exported = await readJson<FirestoreSource | ExportEnvelope>(input)
  const isEnvelope = (source: FirestoreSource | ExportEnvelope): source is ExportEnvelope => 'snapshot' in source && 'sourceChecksum' in source && 'sourceExportTimestamp' in source
  const source: FirestoreSource = isEnvelope(exported) ? exported.snapshot : exported
  const manifest = emptyManifest(isEnvelope(exported) ? exported.sourceChecksum : checksum(source))
  if (isEnvelope(exported)) manifest.sourceExportTimestamp = exported.sourceExportTimestamp
  const add = (collection: string, document: SourceDocument, targetType: string, payload: Record<string, unknown>, targetId = deterministicUuid(`${collection}/${document.id}`)) => manifest.records.push({ sourceCollection: collection, sourceDocumentId: document.id, targetType, targetId, payload, checksum: checksum(payload) });
  for (const user of docs(source, 'users')) add('users', user, 'user', user.data);
  const menu = docs(source, 'menu').find(document => document.id === 'articles')?.data ?? {}
  const articlePositions = new Map(Object.keys(menu).map((id, position) => [id, position]))
  for (const practice of docs(source, 'practices')) {
    add('practices', practice, 'practice', practice.data);
    for (const member of practice.subcollections?.members ?? []) add(`practices/${practice.id}/members`, member, 'practice_member', { ...member.data, practiceId: practice.id });
    for (const invite of practice.subcollections?.invites ?? []) add(`practices/${practice.id}/invites`, invite, 'practice_invitation', { ...invite.data, practiceId: practice.id });
    for (const article of practice.subcollections?.articles ?? []) {
      add(`practices/${practice.id}/articles`, article, 'practice_page', { ...article.data, practiceId: practice.id, slug: article.data.slug ?? article.id });
      const notes = embeddedNotes(article.data)
      if (notes.length) notes.forEach(([noteId, note], position) => add(`practices/${practice.id}/articles/${article.id}/notes`, { id: noteId, data: note }, 'practice_page_section', { ...note, practiceId: practice.id, practicePageId: article.id, position, documentJson: JSON.stringify(editorDocument(note)), extractedText: textValue(note.text) }))
      else for (const [position, note] of (article.subcollections?.notes ?? []).entries()) add(`practices/${practice.id}/articles/${article.id}/notes`, note, 'practice_page_section', { ...note.data, practiceId: practice.id, practicePageId: article.id, position, documentJson: JSON.stringify(editorDocument(note.data)), extractedText: textValue(note.data.text) });
    }
  }
  for (const state of docs(source, 'userState')) add('userState', state, 'user_preference', state.data);
  for (const article of docs(source, 'articles')) {
    const position = articlePositions.get(article.id)
    add('articles', article, 'article', { ...article.data, slug: article.id, isPublished: position !== undefined, position: position ?? 0 });
    const notes = embeddedNotes(article.data)
    if (notes.length) notes.forEach(([noteId, note], notePosition) => add(`articles/${article.id}/notes`, { id: noteId, data: note }, 'article_section', { ...note, articleId: article.id, position: notePosition, documentJson: JSON.stringify(editorDocument(note)), extractedText: textValue(note.text) }))
    else for (const [notePosition, note] of (article.subcollections?.notes ?? []).entries()) add(`articles/${article.id}/notes`, note, 'article_section', { ...note.data, articleId: article.id, position: notePosition, documentJson: JSON.stringify(editorDocument(note.data)), extractedText: textValue(note.data.text) });
  }
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

function payloadString(payload: Record<string, unknown>, key: string, fallback = ''): string { return typeof payload[key] === 'string' ? payload[key] as string : fallback }
function payloadBoolean(payload: Record<string, unknown>, key: string, fallback = false): boolean { return typeof payload[key] === 'boolean' ? payload[key] as boolean : fallback }
function payloadNumber(payload: Record<string, unknown>, key: string, fallback = 0): number { return typeof payload[key] === 'number' && Number.isFinite(payload[key]) ? payload[key] as number : fallback }
function timestamp(value: unknown, fallback: string): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString()
  if (typeof value === 'object' && value !== null && '_seconds' in value && typeof (value as { _seconds: unknown })._seconds === 'number') { const firestoreTimestamp = value as { _seconds: number; _nanoseconds?: unknown }; return new Date(firestoreTimestamp._seconds * 1000 + (typeof firestoreTimestamp._nanoseconds === 'number' ? firestoreTimestamp._nanoseconds / 1_000_000 : 0)).toISOString() }
  return fallback
}
function rowVersion(): Buffer { return Buffer.from(randomUUID().replaceAll('-', ''), 'hex') }
function role(value: unknown): string { return value === 'admin' || value === 'administrator' ? 'Administrator' : value === 'owner' ? 'Owner' : 'Member' }
function invitationStatus(value: unknown): string { return value === 'accepted' ? 'Accepted' : value === 'declined' ? 'Declined' : value === 'revoked' ? 'Revoked' : value === 'expired' ? 'Expired' : 'Pending' }
function slug(value: string, fallback: string): string { const normalized = (value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || fallback).slice(0, 100); return normalized }
function jsonValue(value: unknown, fallback: unknown): string { try { return JSON.stringify(value ?? fallback) } catch { return JSON.stringify(fallback) } }
function extractedText(payload: Record<string, unknown>): string {
  const notes = payload.notes
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) return payloadString(payload, 'text')
  return Object.values(notes).map(note => note && typeof note === 'object' ? payloadString(note as Record<string, unknown>, 'text') : '').filter(Boolean).join(' ')
}

async function importDomainRows(client: Client, manifest: MigrationManifest): Promise<void> {
  const records = (targetType: string) => manifest.records.filter(record => record.targetType === targetType)
  const runTimestamp = manifest.sourceExportTimestamp
  const userIds = new Map<string, string>()
  const userEmails = new Map<string, string>()
  const userPayloads = new Map<string, Record<string, unknown>>()
  for (const record of records('user')) userPayloads.set(record.sourceDocumentId, record.payload)
  for (const record of records('practice_member')) {
    const externalSubject = payloadString(record.payload, 'userId')
    if (!userPayloads.has(externalSubject)) userPayloads.set(externalSubject, { email: record.payload.email ?? null, displayName: record.payload.displayName ?? null, emailVerified: false })
  }
  for (const [externalSubject, payload] of userPayloads) {
    const existing = await client.query<{ id: string }>('SELECT id FROM users WHERE external_subject=$1', [externalSubject])
    const id = existing.rows[0]?.id ?? deterministicUuid(`users/${externalSubject}`)
    const email = textValue(payload.email)
    await client.query('INSERT INTO users(id, external_subject, email, normalized_email, display_name, email_verified, is_global_administrator, created_at, updated_at, row_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9) ON CONFLICT(external_subject) DO UPDATE SET email=excluded.email, normalized_email=excluded.normalized_email, display_name=excluded.display_name, email_verified=excluded.email_verified, is_global_administrator=excluded.is_global_administrator, updated_at=excluded.updated_at, row_version=excluded.row_version', [id, externalSubject, email, email?.trim().toUpperCase() ?? null, textValue(payload.displayName), payloadBoolean(payload, 'emailVerified'), payloadBoolean(payload, 'isGlobalAdministrator'), timestamp(payload.createdAt, runTimestamp), rowVersion()])
    const persisted = await client.query<{ id: string }>('SELECT id FROM users WHERE external_subject=$1', [externalSubject])
    userIds.set(externalSubject, persisted.rows[0].id)
    if (email) userEmails.set(email.trim().toUpperCase(), persisted.rows[0].id)
  }

  const practiceIds = new Map<string, string>()
  for (const record of records('practice')) {
    const name = payloadString(record.payload, 'name', record.sourceDocumentId)
    const practiceSlug = slug(payloadString(record.payload, 'slug', name), record.sourceDocumentId.toLowerCase())
    const existing = await client.query<{ id: string }>('SELECT id FROM practices WHERE slug=$1', [practiceSlug])
    const id = existing.rows[0]?.id ?? record.targetId
    const createdAt = timestamp(record.payload.createdAt, runTimestamp)
    await client.query('INSERT INTO practices(id,name,slug,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$4,$5) ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, updated_at=excluded.updated_at, row_version=excluded.row_version', [id, name.slice(0, 200), practiceSlug, createdAt, rowVersion()])
    practiceIds.set(record.sourceDocumentId, id)
  }

  const aliasTargetIds = new Map<string, string>()
  for (const [externalSubject, id] of userIds) aliasTargetIds.set(`users/${externalSubject}`, id)
  for (const [sourceId, id] of practiceIds) aliasTargetIds.set(`practices/${sourceId}`, id)
  for (const record of records('practice_member')) {
    const practiceId = practiceIds.get(payloadString(record.payload, 'practiceId'))
    const userId = userIds.get(payloadString(record.payload, 'userId'))
    if (!practiceId || !userId) throw new Error(`Cannot resolve practice member references for ${record.sourceDocumentId}`)
    const createdAt = timestamp(record.payload.createdAt, runTimestamp)
    await client.query('INSERT INTO practice_members(practice_id,user_id,role,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$4,$5) ON CONFLICT(practice_id,user_id) DO UPDATE SET role=excluded.role, updated_at=excluded.updated_at, row_version=excluded.row_version', [practiceId, userId, role(record.payload.role), createdAt, rowVersion()])
  }
  for (const record of records('practice_invitation')) {
    const practiceId = practiceIds.get(payloadString(record.payload, 'practiceId'))
    const invitedByUserId = userIds.get(payloadString(record.payload, 'invitedBy'))
    if (!practiceId || !invitedByUserId) throw new Error(`Cannot resolve invitation references for ${record.sourceDocumentId}`)
    const invitedEmail = payloadString(record.payload, 'email').trim()
    const invitedEmailNormalized = invitedEmail.toUpperCase()
    const createdAt = timestamp(record.payload.createdAt, runTimestamp)
    const expiresAt = new Date(Date.parse(createdAt) + 30 * 24 * 60 * 60 * 1000).toISOString()
    const acceptedByUserId = invitationStatus(record.payload.status) === 'Accepted' ? userEmails.get(invitedEmailNormalized) ?? null : null
    const tokenHash = createHash('sha256').update(`firestore:${record.sourceCollection}/${record.sourceDocumentId}`).digest('hex')
    await client.query('INSERT INTO practice_invitations(id,practice_id,invited_by_user_id,accepted_by_user_id,invited_email,invited_email_normalized,role,status,token_hash,expires_at,responded_at,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$13) ON CONFLICT(id) DO UPDATE SET practice_id=excluded.practice_id, invited_by_user_id=excluded.invited_by_user_id, accepted_by_user_id=excluded.accepted_by_user_id, invited_email=excluded.invited_email, invited_email_normalized=excluded.invited_email_normalized, role=excluded.role, status=excluded.status, expires_at=excluded.expires_at, responded_at=excluded.responded_at, updated_at=excluded.updated_at, row_version=excluded.row_version', [record.targetId, practiceId, invitedByUserId, acceptedByUserId, invitedEmail, invitedEmailNormalized, role(record.payload.role), invitationStatus(record.payload.status), tokenHash, expiresAt, invitationStatus(record.payload.status) === 'Pending' ? null : createdAt, createdAt, rowVersion()])
    aliasTargetIds.set(`${record.sourceCollection}/${record.sourceDocumentId}`, record.targetId)
  }
  for (const record of records('user_preference')) {
    const userId = userIds.get(record.sourceDocumentId)
    if (!userId) throw new Error(`Cannot resolve preference user ${record.sourceDocumentId}`)
    const activeSource = textValue(record.payload.activePracticeId) ?? textValue(record.payload.activePraktijkId)
    const activePracticeId = activeSource ? practiceIds.get(activeSource) ?? null : null
    await client.query('INSERT INTO user_preferences(user_id,active_practice_id,updated_at) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET active_practice_id=excluded.active_practice_id, updated_at=excluded.updated_at', [userId, activePracticeId, runTimestamp])
    aliasTargetIds.set(`${record.sourceCollection}/${record.sourceDocumentId}`, userId)
  }

  const pageIds = new Map<string, string>()
  for (const record of records('practice_page')) {
    const practiceSourceId = payloadString(record.payload, 'practiceId')
    const practiceId = practiceIds.get(practiceSourceId)
    if (!practiceId) throw new Error(`Cannot resolve page practice ${practiceSourceId}`)
    const pageSlug = slug(payloadString(record.payload, 'slug', record.sourceDocumentId), record.sourceDocumentId.toLowerCase())
    const existing = await client.query<{ id: string }>('SELECT id FROM practice_pages WHERE practice_id=$1 AND slug=$2', [practiceId, pageSlug])
    const id = existing.rows[0]?.id ?? record.targetId
    await client.query('INSERT INTO practice_pages(id,practice_id,slug,title,extracted_text,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$5,$6,$6,$7) ON CONFLICT(id) DO UPDATE SET practice_id=excluded.practice_id, slug=excluded.slug, title=excluded.title, extracted_text=excluded.extracted_text, updated_at=excluded.updated_at, row_version=excluded.row_version', [id, practiceId, pageSlug, payloadString(record.payload, 'name', pageSlug).slice(0, 200), extractedText(record.payload), runTimestamp, rowVersion()])
    pageIds.set(`${practiceSourceId}/${record.sourceDocumentId}`, id)
    aliasTargetIds.set(`${record.sourceCollection}/${record.sourceDocumentId}`, id)
  }
  for (const record of records('practice_page_section')) {
    const practiceSourceId = payloadString(record.payload, 'practiceId')
    const pageId = pageIds.get(`${practiceSourceId}/${payloadString(record.payload, 'practicePageId')}`)
    const practiceId = practiceIds.get(practiceSourceId)
    if (!practiceId || !pageId) throw new Error(`Cannot resolve page section references for ${record.sourceDocumentId}`)
    await client.query('INSERT INTO practice_page_sections(id,practice_id,practice_page_id,position,heading,document_json,extracted_text,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9) ON CONFLICT(id) DO UPDATE SET position=excluded.position, heading=excluded.heading, document_json=excluded.document_json, extracted_text=excluded.extracted_text, updated_at=excluded.updated_at, row_version=excluded.row_version', [record.targetId, practiceId, pageId, payloadNumber(record.payload, 'position'), payloadString(record.payload, 'name', record.sourceDocumentId).slice(0, 200), payloadString(record.payload, 'documentJson', '[]'), textValue(record.payload.extractedText), runTimestamp, rowVersion()])
    aliasTargetIds.set(`${record.sourceCollection}/${record.sourceDocumentId}`, record.targetId)
  }

  const articleIds = new Map<string, string>()
  for (const record of records('article')) {
    const articleSlug = slug(payloadString(record.payload, 'slug', record.sourceDocumentId), record.sourceDocumentId.toLowerCase())
    const existing = await client.query<{ id: string }>('SELECT id FROM articles WHERE slug=$1', [articleSlug])
    const id = existing.rows[0]?.id ?? record.targetId
    await client.query('INSERT INTO articles(id,slug,title,is_published,position,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$5,$6,$6,$7) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, title=excluded.title, is_published=excluded.is_published, position=excluded.position, updated_at=excluded.updated_at, row_version=excluded.row_version', [id, articleSlug, payloadString(record.payload, 'name', articleSlug).slice(0, 200), payloadBoolean(record.payload, 'isPublished'), payloadNumber(record.payload, 'position'), runTimestamp, rowVersion()])
    articleIds.set(record.sourceDocumentId, id)
    aliasTargetIds.set(`${record.sourceCollection}/${record.sourceDocumentId}`, id)
  }
  for (const record of records('article_section')) {
    const articleId = articleIds.get(payloadString(record.payload, 'articleId'))
    if (!articleId) throw new Error(`Cannot resolve article section ${record.sourceDocumentId}`)
    await client.query('INSERT INTO article_sections(id,article_id,position,heading,document_json,extracted_text,created_at,updated_at,row_version) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8) ON CONFLICT(id) DO UPDATE SET position=excluded.position, heading=excluded.heading, document_json=excluded.document_json, extracted_text=excluded.extracted_text, updated_at=excluded.updated_at, row_version=excluded.row_version', [record.targetId, articleId, payloadNumber(record.payload, 'position'), payloadString(record.payload, 'name', record.sourceDocumentId).slice(0, 200), payloadString(record.payload, 'documentJson', '[]'), textValue(record.payload.extractedText), runTimestamp, rowVersion()])
    aliasTargetIds.set(`${record.sourceCollection}/${record.sourceDocumentId}`, record.targetId)
  }
  for (const [sourceDocumentId, targetId] of aliasTargetIds) await client.query('UPDATE migration_aliases SET target_id=$1 WHERE source_system=$2 AND source_document_id=$3', [targetId, 'firestore', sourceDocumentId])
}

async function importManifest(): Promise<void> {
  const input = required('--input'); const manifest = await readJson<MigrationManifest>(input); const client = new Client({ connectionString: required('--database-url'), ssl: value('--ssl') === 'true' ? { rejectUnauthorized: true } : undefined }); await client.connect();
  try { await client.query('BEGIN'); await client.query('CREATE TABLE IF NOT EXISTS migration_runs (run_id uuid primary key, source_checksum text not null, started_at timestamptz not null, status text not null)'); await client.query('INSERT INTO migration_runs(run_id, source_checksum, started_at, status) VALUES ($1,$2,$3,$4) ON CONFLICT (run_id) DO NOTHING', [manifest.runId, manifest.sourceChecksum, manifest.sourceExportTimestamp, 'running']);
    for (const record of manifest.records) await client.query('INSERT INTO migration_aliases(id, source_system, source_document_id, target_type, target_id, migration_run_id, checksum, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT (source_system, source_document_id) DO UPDATE SET checksum=excluded.checksum, migration_run_id=excluded.migration_run_id', [randomUUID(), 'firestore', `${record.sourceCollection}/${record.sourceDocumentId}`, record.targetType, record.targetId, manifest.runId, record.checksum]);
    await client.query('UPDATE migration_runs SET status=$2 WHERE run_id=$1', [manifest.runId, 'aliases-recorded']);
    await importDomainRows(client, manifest);
    await client.query('UPDATE migration_runs SET status=$2 WHERE run_id=$1', [manifest.runId, 'domain-loaded']); await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.end(); }
}

async function validateTarget(): Promise<void> {
  const input = required('--input'); const output = required('--output'); const manifest = await readJson<MigrationManifest>(input); const client = new Client({ connectionString: required('--database-url') }); await client.connect();
  try { const result = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM migration_aliases WHERE migration_run_id=$1', [manifest.runId]); await writeJson(output, { runId: manifest.runId, sourceRecords: manifest.records.length, aliasRecords: Number(result.rows[0].count), reconciled: Number(result.rows[0].count) === manifest.records.length }); } finally { await client.end(); }
}

async function report(): Promise<void> { const input = required('--input'); const output = required('--output'); const manifest = await readJson<MigrationManifest>(input); const recordCounts = manifest.records.reduce<Record<string, number>>((counts, record) => { counts[record.targetType] = (counts[record.targetType] ?? 0) + 1; return counts }, {}); await writeJson(output, { runId: manifest.runId, sourceExportTimestamp: manifest.sourceExportTimestamp, sourceChecksum: manifest.sourceChecksum, recordCounts, errorCodes: manifest.errors.map(error => error.code), sensitivePayloadsOmitted: true }); }
async function exportSource(): Promise<void> {
  const output = required('--output')
  const envFile = value('--env-file')
  if (envFile) await loadEnvFile(envFile)
  const snapshot = value('--input') ? JSON.parse(await readFile(required('--input'), 'utf8')) : await snapshotFirestore()
  await writeJson(output, { sourceExportTimestamp: new Date().toISOString(), sourceChecksum: checksum(snapshot), snapshot })
}

const commands: Record<string, () => Promise<void>> = { transform, 'validate-source': validateSource, import: importManifest, 'validate-target': validateTarget, report, export: exportSource };
if (!commands[command]) throw new Error(`Unknown command ${command}`); await commands[command]()
