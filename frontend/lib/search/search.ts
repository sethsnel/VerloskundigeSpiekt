import { SearchableNote } from './search-schema'

export interface SearchResults { notes: SearchableNote[]; total: number; facets?: Record<string, Record<string, number>> }

export async function searchNotes(searchText: string, options: { articleId?: string; tagFilters?: string[]; skip?: number; top?: number; includeFacets?: boolean } = {}): Promise<SearchResults> {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
  const response = await fetch(`${apiBaseUrl}/api/v1/search?query=${encodeURIComponent(searchText)}`, { signal: undefined })
  if (!response.ok) throw new Error(`Search request failed: ${response.status}`)
  const results = await response.json() as Array<{ kind: string; id: string; title: string; practiceId?: string; snippet: string }>
  const notes = results.map(result => ({ id: result.id, noteId: result.id, name: result.title, content: result.snippet, articleId: result.id, articleName: result.title, tagIds: [] }))
  return { notes, total: notes.length }
}
