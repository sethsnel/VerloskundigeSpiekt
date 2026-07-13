'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import { generatedApi, type ApiPage } from '../../api/generated'
import { Note } from '../../../schema/article'
import { ArticlePractice } from '../../../schema/practice'
import { getPracticeArticleQueryKey } from '../../react-query'

const usePracticeArticle = (practiceId?: string, slug?: string) => {
  const queryClient = useQueryClient()
  const queryKey = getPracticeArticleQueryKey(practiceId, slug)

  const articleQuery = useQuery(
    queryKey,
    async () => mapPage(await generatedApi.getPage(practiceId as string, slug as string)),
    { enabled: Boolean(practiceId && slug) }
  )

  const upsertArticleMutation = useMutation(
    async (article: ArticlePractice) => {
      const sections = mapNotes(article)
      return mapPage(article.version ? await generatedApi.updatePage(practiceId as string, slug as string, article.name, sections, article.version) : await generatedApi.createPage(practiceId as string, slug as string, article.name, sections))
    },
    {
      onSuccess: (article) => {
        queryClient.setQueryData(queryKey, article)
      },
    }
  )

  const upsertNoteMutation = useMutation(
    async (note: Note) => {
      const article = queryClient.getQueryData<ArticlePractice>(queryKey)
      if (!article?.version) throw new Error('Refresh the page before editing notes.')
      const updated = { ...article, notes: { ...article.notes, [note.id]: note } }
      await generatedApi.updatePage(practiceId as string, slug as string, updated.name, mapNotes(updated), article.version)
      return note
    },
    {
      onSuccess: (note) => {
        const article = queryClient.getQueryData<ArticlePractice>(queryKey)
        if (article) {
          queryClient.setQueryData(queryKey, {
            ...article,
            notes: {
              ...article.notes,
              [note.id]: note,
            },
          })
        }
      },
    }
  )

  const deleteNoteMutation = useMutation(
    async (noteId: string) => {
      const article = queryClient.getQueryData<ArticlePractice>(queryKey)
      if (!article?.version) throw new Error('Refresh the page before deleting notes.')
      const notes = { ...article.notes }; delete notes[noteId]
      await generatedApi.updatePage(practiceId as string, slug as string, article.name, mapNotes({ ...article, notes }), article.version)
      return noteId
    },
    {
      onSuccess: (noteId) => {
        const article = queryClient.getQueryData<ArticlePractice>(queryKey)
        if (article?.notes) {
          const { [noteId]: deletedNote, ...remainingNotes } = article.notes
          queryClient.setQueryData(queryKey, {
            ...article,
            notes: remainingNotes,
          })
        }
      },
    }
  )

  return {
    articleQuery,
    upsertArticleMutation,
    upsertNoteMutation,
    deleteNoteMutation,
  }
}

const mapPage = (page: ApiPage): ArticlePractice => ({ id: page.id, slug: page.slug, name: page.title, version: page.version, notes: Object.fromEntries(page.sections.map(section => [section.id, { id: section.id, name: section.heading ?? '', text: '', json: JSON.parse(section.documentJson ?? '[]') }])) })
const mapNotes = (article: ArticlePractice) => Object.values(article.notes ?? {}).map(note => ({ heading: note.name, documentJson: JSON.stringify(note.json ?? [{ type: 'paragraph', children: [{ text: note.text }] }]) }))

export default usePracticeArticle
