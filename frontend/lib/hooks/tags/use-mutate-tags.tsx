'use client'
import { useMutation, useQueryClient } from "react-query"

import { mutateTags } from "../../firestore/tags"
import { Article, Tag, UpsertTag } from "../../../schema/article"
import { getTagQueryKey, getTagsQueryKey } from "../../react-query"

const useMutateTags = (article: Article) => {
  const queryClient = useQueryClient()

  const addTagToArticleMutation = useMutation(
    async (tag: UpsertTag) => {
      return await mutateTags.addTagToArticle(tag, article)
    },
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries(getTagQueryKey(result.tag.id))
        queryClient.invalidateQueries(getTagsQueryKey())
      },
    }
  )

  const removeTagFromArticleMutation = useMutation(
    async (tag: Tag) => {
      return await mutateTags.removeTagFromArticle(tag, article)
    },
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries(getTagQueryKey(result.tag.id))
        queryClient.invalidateQueries(getTagsQueryKey())
      },
    }
  )

  return {
    addTagToArticleMutation,
    removeTagFromArticleMutation
  }
}

export default useMutateTags
