'use client'

import { Notes } from '../../../containers/notes'
import { Article } from '../../../schema/article'

import { EditablePageHeader } from '../../../components/header'

import styles from '../../../styles/Article.module.scss'
import { useArticles } from '../../../lib/hooks/articles'

interface ArticlePageProps {
  article: Article
}

const ArticlePage = ({ article }: ArticlePageProps) => {
  const { addArticleMutation } = useArticles()

  return (
    <div className={styles.container}>
      <EditablePageHeader key={article?.id} title={article?.name ?? ''} onSave={(updatedTitle) => addArticleMutation.mutate({ ...article, name: updatedTitle })} />

      <main className={styles.main}>
        {
          article ? <Notes article={article} /> : undefined
        }
      </main>
    </div>
  )
}

export default ArticlePage
