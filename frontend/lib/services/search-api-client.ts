/**
 * Client for interacting with search index API endpoints
 */

import { SearchResults } from "../search/search"

/**
 * Indexes all notes for a specific article in the search engine
 * @param articleId - The ID of the article whose notes should be indexed
 */
export async function indexArticleNotesApi(articleId: string): Promise<void> {
  const response = await fetch('/api/search/index-article-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ articleId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to index article notes')
  }
}

/**
 * Deletes a specific note from the search index
 * @param noteId - The ID of the note to be removed from the search index
 */
export async function deleteNoteFromIndexApi(noteId: string): Promise<void> {
  const response = await fetch('/api/search/delete-note-from-index', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ noteId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete note from index')
  }
}

/**
 * Deletes all notes for a specific article from the search index
 * @param articleId - The ID of the article whose notes should be removed from the search index
 */
export async function deleteArticleNotesFromIndexApi(articleId: string): Promise<void> {
  const response = await fetch('/api/search/delete-article-notes-from-index', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ articleId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete article notes from index')
  }
}

/**
 * Deletes all notes for a specific article from the search index
 * @param articleId - The ID of the article whose notes should be removed from the search index
 */
export async function queryIndexApi(query: string, pageSize?: number, skip?: number): Promise<SearchResults> {
  const response = await fetch('/api/search/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, pageSize, skip }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete article notes from index')
  }

  return await response.json()
}