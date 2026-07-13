'use client'

import { useQuery } from 'react-query'
import { generatedApi } from '../../../lib/api/generated'
import { mapArticle } from '../../../lib/hooks/articles/use-articles'
import { getArticleQueryKey } from '../../../lib/react-query'
import ArticlePage from './artikel'

export default function ArticleLoader({ articleId }: { articleId: string }) {
  const query = useQuery(getArticleQueryKey(articleId), async () => mapArticle(await generatedApi.getArticle(articleId)))
  if (query.isLoading) return <div className="spinner-grow" role="status" />
  if (!query.data) return <p>Artikel niet gevonden.</p>
  return <ArticlePage article={query.data} />
}
