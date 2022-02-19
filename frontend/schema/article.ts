export type Article = {
  id?: string
  name: string
  notes: Record<string, Note>
}

export type Note = {
  id: string
  name: string
  text: string
}
