import { Descendant } from "slate"

export type Article = {
  id: string
  name: string
  headerUrl?: string
  notes?: Record<string, Note>
  tagIds: string[]
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
  articleIds: string[]
}

export type UpsertTag = Omit<Tag, 'id'> & {
  id?: string
}