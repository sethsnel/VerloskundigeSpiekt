import { getArticle, getArticles } from '../../../lib/firestore/articles'
import ArticlePage from './artikel'

export default async function Article({ params }: { params: { articleId: string } }) {
  const article = await getArticle(params.articleId)
  return <ArticlePage article={article} />
}

// export const dynamicParams = true

// export async function generateStaticParams() {
//   const articles = await getArticles()
//   return articles.map((a) => ({
//     articleId: a.id,
//   }))
// }
