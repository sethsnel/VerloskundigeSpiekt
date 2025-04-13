'use client'
import { useMutation, useQueryClient } from "react-query"

import { mutateTags } from "../../firestore/tags"
import { Article, Tag, UpsertTag } from "../../../schema/article"
import { getTagQueryKey, getTagsQueryKey } from "../../react-query"

const useMutationTags = (article: Article) => {
  const queryClient = useQueryClient()

  const addTagsToArticleMutation = useMutation(
    async (tags: UpsertTag[]) => {
      return await mutateTags.addTagsToArticle(tags, article)
    },
    {
      onSuccess: (result) => {
        result.tags.forEach(tag => {
          queryClient.invalidateQueries(getTagQueryKey(tag.id))
        })
        queryClient.invalidateQueries(getTagsQueryKey([...result.tags.map((tag) => tag.id)]))
      },
    }
  )

  const removeTagsFromArticleMutation = useMutation(
    async (tags: Tag[]) => {
      return await mutateTags.removeTagsFromArticle(tags, article)
    },
    {
      onSuccess: (result) => {
        result.tags.forEach(tag => {
          queryClient.invalidateQueries(getTagQueryKey(tag.id))
        })
        queryClient.invalidateQueries(getTagsQueryKey([...result.tags.map((tag) => tag.id)]))
      },
    }
  )

  return {
    addTagsToArticleMutation,
    removeTagsFromArticleMutation
  }
}

export default useMutationTags
