export type SourceDocument = { id: string; data: Record<string, unknown>; subcollections?: Record<string, SourceDocument[]> }
export type ManifestRecord = { sourceCollection: string; sourceDocumentId: string; targetType: string; targetId: string; payload: Record<string, unknown>; checksum: string }
export type MigrationManifest = { runId: string; sourceExportTimestamp: string; sourceChecksum: string; checksumAlgorithm: 'canonical-json-sha256-v1'; toolVersion: string; schemaVersion: number; records: ManifestRecord[]; errors: { code: string; sourceDocumentId?: string }[] }
