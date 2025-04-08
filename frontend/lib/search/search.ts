import { searchClient, SearchableNote } from './search-client'

export interface SearchResults {
  notes: SearchableNote[]
  total: number
  facets?: Record<string, Record<string, number>>
}

export async function searchNotes(
  searchText: string,
  options: {
    articleId?: string
    tagFilters?: string[]
    skip?: number
    top?: number
    includeFacets?: boolean
  } = {}
): Promise<SearchResults> {
  const {
    articleId,
    tagFilters,
    skip = 0,
    top = 10,
    includeFacets = false
  } = options

  // Build filter string for tags and articleId if specified
  let filterExpressions: string[] = []

  if (articleId) {
    filterExpressions.push(`articleId eq '${articleId}'`)
  }

  if (tagFilters && tagFilters.length > 0) {
    filterExpressions.push(tagFilters
      .map(tag => `tagIds/any(t: t eq '${tag}')`)
      .join(' and '))
  }

  // Perform the search
  const searchResults = await searchClient.search(searchText, {
    filter: filterExpressions.length > 0 ? filterExpressions.join(' and ') : undefined,
    facets: includeFacets ? ['tagIds'] : undefined,
    skip,
    top,
    includeTotalCount: true,
    orderBy: ['search.score() desc']
  })

  // Convert results to a more usable format
  const notes: SearchableNote[] = []
  const facets: Record<string, Record<string, number>> = {}

  for await (const result of searchResults.results) {
    if (result.document) {
      notes.push(result.document)
    }
  }

  if (searchResults.facets) {
    for (const [field, values] of Object.entries(searchResults.facets)) {
      facets[field] = {}
      for (const value of values) {
        if (value.value && typeof value.count === 'number') {
          facets[field][value.value.toString()] = value.count
        }
      }
    }
  }

  return {
    notes,
    total: searchResults.count || 0,
    facets: Object.keys(facets).length > 0 ? facets : undefined
  }
}