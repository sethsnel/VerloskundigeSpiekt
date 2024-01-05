import type { GetStaticPropsContext, NextPage } from 'next'

import { Notes } from '../../containers/notes'
import { Article } from '../../schema/article'

import fetchLayoutProps from '../../lib/shared/fetchLayoutProps'
import { DefaultLayout } from '../../components/layout'
import { EditablePageHeader } from '../../components/header'

import styles from '../../styles/Article.module.scss'
import getArticles from '../../lib/firestore/articles/get-articles'
import getArticle from '../../lib/firestore/articles/get-article'
import { getArticleQueryKey } from '../../lib/react-query'
import { dehydrate, QueryClient, useQuery } from 'react-query'
import { useArticles } from '../../lib/hooks/articles'

interface ArticlePageProps {
  articleId: string
}

type ArticlePageParams = {
  articleId: string
}

const ArticlePage: NextPage<ArticlePageProps> = (props) => {
  const articleQK = getArticleQueryKey(props.articleId)
  const { data: article } = useQuery(articleQK, () => getArticle(props.articleId))
  const { addArticleMutation } = useArticles()

  return (
    <DefaultLayout>
      <div className={styles.container}>
        <EditablePageHeader key={article?.id} title={article?.name ?? ''} onSave={(updatedTitle) => addArticleMutation.mutate({ ...article, name: updatedTitle })} />

        <main className={styles.main}>
          {
            article ? <Notes article={article} /> : undefined
          }
        </main>
      </div>
    </DefaultLayout>
  )
}

export async function getStaticProps({ params }: GetStaticPropsContext<ArticlePageParams>) {
  const queryClient = new QueryClient()
  const articleQK = getArticleQueryKey(params?.articleId || '')
  await queryClient.prefetchQuery(articleQK, () => getArticle(params?.articleId || ''))
  await queryClient.prefetchQuery('layoutPropsQueryKey', fetchLayoutProps)

  return {
    props: {
      articleId: params?.articleId || '',
      dehydratedState: dehydrate(queryClient)
    },
    revalidate: 30,
  }
}

export async function getStaticPaths() {
  const articles = await getArticles()

  return {
    paths: articles.map((p) => ({ params: { articleId: p.id } })),
    fallback: 'blocking',
  }
}

export default ArticlePage
