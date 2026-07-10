import { SearchableNote } from './search-schema'

// Search infrastructure is server-owned. These compatibility exports remain only for
// the old admin index commands while feature migration removes those commands.
export const searchIndexSchema = { name: 'postgres-content' }
type SearchResultsPage = { results: AsyncIterable<{ document?: SearchableNote }> }
export const searchClient = {
  search: async (_query: string, _options?: unknown): Promise<SearchResultsPage> => { throw new Error('Direct search infrastructure access has been retired; use /api/v1/search.') },
  uploadDocuments: async (_documents: SearchableNote[]) => { throw new Error('Use the API search rebuild job.') },
  deleteDocuments: async (_documents: SearchableNote[]) => { throw new Error('Use the API search rebuild job.') },
}
export const adminClient = {
  listIndexes: async (): Promise<{ next(): Promise<IteratorResult<{ name: string }>> }> => { throw new Error('Search index administration belongs to the backend migration job.') },
  createIndex: async (_schema: unknown) => { throw new Error('Search index administration belongs to the backend migration job.') },
  deleteIndex: async (_name: string) => { throw new Error('Search index administration belongs to the backend migration job.') },
}
