'use client'
import { useQuery } from "react-query"
import { generatedApi } from '../../api/generated'

const useQueryTags = (filterTagIds?: string[]) => {
  const queryTags = useQuery(
    ['tags', ...filterTagIds || []],
    async () => {
      const [tags, articles] = await Promise.all([generatedApi.listTags(), generatedApi.listArticles()])
      return tags.filter(tag => !filterTagIds?.length || filterTagIds.includes(tag.id)).map(tag => ({ id: tag.id, name: tag.name, version: tag.version, articles: tag.articleIds.map(articleId => { const article = articles.find(item => item.id === articleId); return { id: articleId, name: article?.title ?? articleId } }) }))
    }
  )

  return { queryTags }
}

export default useQueryTags

