'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import {
  deletePracticeNote,
  getPracticeArticle,
  upsertPracticeArticle,
  upsertPracticeNote,
} from '../../firestore/practices'
import { Note } from '../../../schema/article'
import { ArticlePractice } from '../../../schema/practice'
import { getPracticeArticleQueryKey } from '../../react-query'

const usePracticeArticle = (practiceId?: string, slug?: string) => {
  const queryClient = useQueryClient()
  const queryKey = getPracticeArticleQueryKey(practiceId, slug)

  const articleQuery = useQuery(
    queryKey,
    () => getPracticeArticle(practiceId as string, slug as string),
    { enabled: Boolean(practiceId && slug) }
  )

  const upsertArticleMutation = useMutation(
    (article: ArticlePractice) => upsertPracticeArticle(practiceId as string, article),
    {
      onSuccess: (article) => {
        queryClient.setQueryData(queryKey, article)
      },
    }
  )

  const upsertNoteMutation = useMutation(
    (note: Note) => upsertPracticeNote(practiceId as string, slug as string, note),
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
    (noteId: string) => deletePracticeNote(practiceId as string, slug as string, noteId),
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

export default usePracticeArticle
