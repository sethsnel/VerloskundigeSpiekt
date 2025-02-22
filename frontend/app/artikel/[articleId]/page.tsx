import { Suspense } from 'react'
import { getArticle } from '../../../lib/firestore/articles'
import ArticlePage from './artikel'

async function LoadArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params
  const article = await getArticle(articleId)
  return <ArticlePage article={article} />
}

export default async function Article({ params }: { params: Promise<{ articleId: string }> }) {
  return <Suspense fallback={
    <div className="d-flex justify-content-center">
      <div className="spinner-grow" role="status" />
    </div>}>
    <LoadArticlePage params={params} />
  </Suspense>
}

// export const dynamicParams = true

// export async function generateStaticParams() {
//   const articles = await getArticles()
//   return articles.map((a) => ({
//     articleId: a.id,
//   }))
// }
