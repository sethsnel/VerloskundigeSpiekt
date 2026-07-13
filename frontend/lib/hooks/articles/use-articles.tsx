'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from 'react-query'

import { generatedApi, type ApiArticle } from '../../api/generated'
import { getArticleQueryKey } from '../../react-query'
import { UpsertArticle } from '../../../schema/article'

const useArticles = () => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  const addArticleMutation = useMutation(async (article: UpsertArticle) => {
    const sections = Object.values(article.notes ?? {}).map(note => ({ heading: note.name, documentJson: JSON.stringify(note.json ?? [{ type: 'paragraph', children: [{ text: note.text }] }]) }))
    const request = { slug: article.slug ?? article.id ?? article.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'), title: article.name, position: article.position ?? 0, headerUrl: article.headerUrl ?? null, isPublished: article.isPublished ?? true, sections: sections.length ? sections : [{ heading: article.name, documentJson: '[]' }], tagIds: article.tagIds ?? [] }
    const result = article.id ? await generatedApi.updateArticle(article.id, request, article.version ?? (() => { throw new Error('Refresh the article before updating.') })()) : await generatedApi.createArticle(request)
    return mapArticle(result)
  }, {
    onSuccess: async (upsertedArticle) => {
      if (upsertedArticle) {
        queryClient.setQueryData(getArticleQueryKey(upsertedArticle.id), upsertedArticle)

        if (!upsertedArticle.notes) {
          push(`/artikel/${upsertedArticle.id}`)
        }
      }
    },
  })

  const deleteArticleMutation = useMutation(async (articleId: string) => { const article = queryClient.getQueryData<UpsertArticle>(getArticleQueryKey(articleId)); if (!article?.version) throw new Error('Refresh the article before deleting.'); await generatedApi.deleteArticle(articleId, article.version); return articleId }, {
    onSuccess: (deletedArticleId) => {
      push('/')
      queryClient.removeQueries(getArticleQueryKey(deletedArticleId))
    },
  })

  return { addArticleMutation, deleteArticleMutation }
}

export const mapArticle = (article: ApiArticle): UpsertArticle & { id: string } => ({ id: article.id, slug: article.slug, name: article.title, headerUrl: article.headerUrl ?? undefined, tagIds: article.tagIds, position: article.position, isPublished: article.isPublished, version: article.version, notes: Object.fromEntries(article.sections.map(section => [section.id, { id: section.id, name: section.heading ?? '', text: '', json: JSON.parse(section.documentJson ?? '[]') }])) })

export default useArticles
