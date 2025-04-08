'use client'

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "react-query"

import { DefaultLayoutProps } from "../../../components/layout"
import { UpsertArticle } from "../../../schema/article"
import { deleteArticle, upsertArticle } from "../../firestore/articles"
import { getArticleQueryKey } from "../../react-query"
import fetchLayoutProps from "../../shared/fetchLayoutProps"
import { indexAllNotes, deleteArticleNotesFromIndex } from '../../search/manage-index'

const useArticles = () => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  const addArticleMutation = useMutation(
    (article: UpsertArticle) => upsertArticle(article),
    {
      onSuccess: async upsertedArticle => {
        if (upsertedArticle) {
          const keyToUpdate = getArticleQueryKey(upsertedArticle.id || '')
          queryClient.setQueryData(keyToUpdate, { ...upsertedArticle })

          // Reindex all notes since article metadata changed
          if (upsertedArticle.notes) {
            await indexAllNotes(upsertedArticle)
          }

          if (!upsertedArticle.notes) {
            push(`/artikel/${upsertedArticle.id}`)
          }
        }
      }
    }
  )

  const deleteArticleMutation = useMutation(
    (articleId: string) => deleteArticle(articleId),
    {
      onSuccess: async deletedArticleId => {
        push('/')
        queryClient.removeQueries(getArticleQueryKey(deletedArticleId))

        // Remove all notes from search index
        await deleteArticleNotesFromIndex(deletedArticleId)
      }
    }
  )

  return { addArticleMutation, deleteArticleMutation }
}

export default useArticles
