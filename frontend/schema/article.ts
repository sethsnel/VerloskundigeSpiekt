export type Article = {
  id: string
  name: string
  notes?: Record<string, Note>
}

export type UpdateArticle = Omit<Article, 'id'> & {
  id?: string
}

export type Note = {
  id: string
  name: string
  text: string
}
