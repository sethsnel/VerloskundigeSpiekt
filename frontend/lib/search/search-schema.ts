import { Article, Note } from '../../schema/article'

// Document type for the search index
export interface SearchableNote {
  id: string
  noteId: string
  name: string
  content: string
  articleId: string
  articleName: string
  tagIds?: string[]
}

// Convert Note to SearchableNote
export function noteToSearchable(note: Note, article: Article): SearchableNote {
  const content = note.text.replace(/(<([^>]+)>)/gi, '')
  // Sanitize ID by prefixing underscore IDs with 'n-' to avoid search index restrictions
  const sanitizedId = note.id.startsWith('_') ? `n-${note.id}` : note.id
  return {
    id: sanitizedId,
    noteId: note.id,
    name: note.name,
    content,
    articleId: article.id,
    articleName: article.name,
    tagIds: article.tagIds,
  }
}
