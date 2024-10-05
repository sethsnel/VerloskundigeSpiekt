'use client'

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "react-query"

import { DefaultLayoutProps } from "../../../components/layout"
import { UpdateArticle } from "../../../schema/article"
import { deleteArticle, upsertArticle } from "../../firestore/articles"
import { getArticleQueryKey } from "../../react-query"
import fetchLayoutProps from "../../shared/fetchLayoutProps"

const useArticles = () => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  let { data } = useQuery('layoutPropsQueryKey', fetchLayoutProps)
  data = data ?? { articles: [] }
  const { articles } = data as DefaultLayoutProps

  const addArticleMutation = useMutation(
    (article: UpdateArticle) => upsertArticle(article),
    {
      onSuccess: upsertedArticle => {
        if (upsertedArticle) {
          const keyToUpdate = getArticleQueryKey(upsertedArticle.id || '')
          queryClient.setQueryData(keyToUpdate, { ...upsertedArticle })

          const articleIndex = articles.findIndex(a => a.id == upsertedArticle.id)

          if (articleIndex !== -1) {
            articles[articleIndex] = { ...upsertedArticle }
            queryClient.setQueryData('layoutPropsQueryKey', { ...data, articles })
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
      onSuccess: deletedArticleId => {
        push('/')
        queryClient.removeQueries(getArticleQueryKey(deletedArticleId))
      }
    }
  )

  return { addArticleMutation, deleteArticleMutation }
}

export default useArticles
