import { Article, Note } from '../../schema/article'

// Document type for the search index
export interface SearchableNote {
  id: string
  name: string
  content: string
  articleId: string
  articleName: string
  tagIds?: string[]
}

// Convert Note to SearchableNote
export function noteToSearchable(note: Note, article: Article): SearchableNote {
  const content = note.text.replace(/(<([^>]+)>)/gi, '')
  return {
    id: note.id,
    name: note.name,
    content,
    articleId: article.id,
    articleName: article.name,
    tagIds: article.tagIds,
  }
}
