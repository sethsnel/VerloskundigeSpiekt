import type { GetStaticPropsContext, NextPage } from 'next'

import { Notes } from '../../containers/notes'
import { Article } from '../../schema/article'

import fetchLayoutProps from '../../lib/shared/fetchLayoutProps'
import { DefaultLayout, DefaultLayoutProps } from '../../components/layout'

import styles from '../../styles/Article.module.scss'
import getarticles from '../../lib/firestore/articles/get-articles'
import getArticle from '../../lib/firestore/articles/get-article'

interface ArticlePageProps {
  article: Article
  layoutProps: DefaultLayoutProps
}

type ArticlePageParams = {
  articleId: string
}

const ArticlePage: NextPage<ArticlePageProps> = (props) => {
  return (
    <DefaultLayout {...props.layoutProps}>
      <div className={styles.container}>
        <h1 className={styles.title}>{props.article.name}</h1>

        <main className={styles.main}>
          <Notes notes={Object.values(props.article.notes)} articleId={props.article.id as string} />
        </main>
      </div>
    </DefaultLayout>
  )
}

export async function getStaticProps({ params }: GetStaticPropsContext<ArticlePageParams>) {
  const layoutProps = await fetchLayoutProps()
  const article = await getArticle(params?.articleId || '')

  return {
    props: {
      article,
      layoutProps,
    },
    revalidate: 10,
  }
}

export async function getStaticPaths() {
  const articles = await getarticles()

  return {
    paths: articles.map((p) => ({ params: { articleId: p.id } })),
    fallback: 'blocking',
  }
}

export default ArticlePage
