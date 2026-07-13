import { Descendant } from "slate"

export type Article = {
  id: string
  name: string
  headerUrl?: string
  notes?: Record<string, Note>
  tagIds?: string[]
  slug?: string
  position?: number
  isPublished?: boolean
  version?: string
}

export type UpsertArticle = Omit<Article, 'id'> & {
  id?: string
}

export type Note = {
  id: string
  name: string
  text: string
  json?: Descendant[]
}

export type Tag = {
  id: string
  name: string
  articles: {
    id: string
    name: string
  }[]
  version?: string
}

export type UpsertTag = Omit<Tag, 'id'> & {
  id?: string
}
