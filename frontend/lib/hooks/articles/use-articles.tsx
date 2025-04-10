'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from 'react-query'

import { deleteArticleNotesFromIndexApi, indexArticleNotesApi } from '../../services/search-api-client'
import { deleteArticle, upsertArticle } from '../../firestore/articles'
import { getArticleQueryKey } from '../../react-query'
import { UpsertArticle } from '../../../schema/article'

const useArticles = () => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  const addArticleMutation = useMutation((article: UpsertArticle) => upsertArticle(article), {
    onSuccess: async (upsertedArticle) => {
      if (upsertedArticle) {
        queryClient.setQueryData(getArticleQueryKey(upsertedArticle.id), upsertedArticle)

        if (upsertedArticle.notes) {
          await indexArticleNotesApi(upsertedArticle.id)
        }

        if (!upsertedArticle.notes) {
          push(`/artikel/${upsertedArticle.id}`)
        }
      }
    },
  })

  const deleteArticleMutation = useMutation((articleId: string) => deleteArticle(articleId), {
    onSuccess: async (deletedArticleId) => {
      push('/')
      queryClient.removeQueries(getArticleQueryKey(deletedArticleId))
      await deleteArticleNotesFromIndexApi(deletedArticleId)
    },
  })

  return { addArticleMutation, deleteArticleMutation }
}

export default useArticles
