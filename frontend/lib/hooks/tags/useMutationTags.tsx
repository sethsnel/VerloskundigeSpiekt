'use client'
import { useMutation, useQueryClient } from 'react-query'

import { generatedApi } from '../../api/generated'
import { Article, Tag, UpsertTag } from '../../../schema/article'
import { getTagQueryKey, getTagsQueryKey } from '../../react-query'

const useMutationTags = (article: Article) => {
  const queryClient = useQueryClient()

  const addTagsToArticleMutation = useMutation(
    async (tags: UpsertTag[]) => {
      return await updateArticleTags(article, [...new Set([...(article.tagIds ?? []), ...tags.map(tag => tag.id).filter(Boolean) as string[]])], tags)
    },
    {
      onSuccess: async (result) => {
        result.tags.forEach((tag) => {
          queryClient.invalidateQueries(getTagQueryKey(tag.id))
        })
        queryClient.invalidateQueries(getTagsQueryKey([...result.tags.map((tag) => tag.id)]))

      },
    },
  )

  const removeTagsFromArticleMutation = useMutation(
    async (tags: Tag[]) => {
      return await updateArticleTags(article, (article.tagIds ?? []).filter(tagId => !tags.some(tag => tag.id === tagId)), tags)
    },
    {
      onSuccess: async (result) => {
        result.tags.forEach((tag) => {
          queryClient.invalidateQueries(getTagQueryKey(tag.id))
        })
        queryClient.invalidateQueries(getTagsQueryKey([...result.tags.map((tag) => tag.id)]))

      },
    },
  )

  return {
    addTagsToArticleMutation,
    removeTagsFromArticleMutation,
  }
}

const updateArticleTags = async (article: Article, tagIds: string[], tags: UpsertTag[] | Tag[]) => {
  if (!article.version) throw new Error('Refresh the article before changing tags.')
  const sections = Object.values(article.notes ?? {}).map(note => ({ heading: note.name, documentJson: JSON.stringify(note.json ?? []) }))
  const updated = await generatedApi.updateArticle(article.id, { slug: article.slug ?? article.id, title: article.name, position: article.position ?? 0, headerUrl: article.headerUrl ?? null, isPublished: article.isPublished ?? true, sections: sections.length ? sections : [{ heading: article.name, documentJson: '[]' }], tagIds }, article.version)
  return { article: { ...article, tagIds, version: updated.version }, tags: tags.map(tag => ({ ...tag, id: tag.id as string })) }
}

export default useMutationTags
