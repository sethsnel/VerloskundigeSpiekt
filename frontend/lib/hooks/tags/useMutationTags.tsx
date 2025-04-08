'use client'
import { useMutation, useQueryClient } from "react-query"

import { mutateTags } from "../../firestore/tags"
import { Article, Tag, UpsertTag } from "../../../schema/article"
import { getTagQueryKey, getTagsQueryKey } from "../../react-query"
import { indexAllNotes } from "../../search/manage-index"

const useMutationTags = (article: Article) => {
  const queryClient = useQueryClient()

  const addTagsToArticleMutation = useMutation(
    async (tags: UpsertTag[]) => {
      return await mutateTags.addTagsToArticle(tags, article)
    },
    {
      onSuccess: async (result) => {
        result.tags.forEach(tag => {
          queryClient.invalidateQueries(getTagQueryKey(tag.id))
        })
        queryClient.invalidateQueries(getTagsQueryKey([...result.tags.map((tag) => tag.id)]))

        // Reindex all notes since tags changed
        await indexAllNotes(result.article)
      },
    }
  )

  const removeTagsFromArticleMutation = useMutation(
    async (tags: Tag[]) => {
      return await mutateTags.removeTagsFromArticle(tags, article)
    },
    {
      onSuccess: async (result) => {
        result.tags.forEach(tag => {
          queryClient.invalidateQueries(getTagQueryKey(tag.id))
        })
        queryClient.invalidateQueries(getTagsQueryKey([...result.tags.map((tag) => tag.id)]))

        // Reindex all notes since tags changed
        await indexAllNotes(result.article)
      },
    }
  )

  return {
    addTagsToArticleMutation,
    removeTagsFromArticleMutation
  }
}

export default useMutationTags
