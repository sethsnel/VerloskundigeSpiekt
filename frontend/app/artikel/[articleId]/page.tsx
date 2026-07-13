import { Suspense } from 'react'
import ArticleLoader from './article-loader'
import { Metadata } from 'next'
import { getChannelLabels } from 'content/labels'

const labels = getChannelLabels()

async function LoadArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params
  return <ArticleLoader articleId={articleId} />
}

export async function generateMetadata(
  { params }: { params: Promise<{ articleId: string }> }
): Promise<Metadata> {
  const { articleId } = await params
  return {
    title: `${labels.websiteTitle} - ${articleId}`
  }
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
