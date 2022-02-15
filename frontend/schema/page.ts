export type Page = {
  id?: string
  name: string
  notes: Note[]
}

export type Note = {
  id: string
  name: string
  text: string
}
