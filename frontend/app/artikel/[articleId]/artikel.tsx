'use client'

import { Notes } from '../../../containers/notes'
import { Article } from '../../../schema/article'

import { EditablePageHeader } from '../../../components/header'

import styles from '../../../styles/Article.module.scss'
import { useArticles } from '../../../lib/hooks/articles'
import EditableBanner from '../../../components/banner/banner'
import EditableTags from '../../../components/tags/tags'
import useQueryTags from '../../../lib/hooks/tags/useQueryTags'

interface ArticlePageProps {
  article: Article
}

const ArticlePage = ({ article }: ArticlePageProps) => {
  const { addArticleMutation } = useArticles()
  const { queryTags } = useQueryTags()

  return (
    <div className={`${styles.container} d-flex flex-column gap-3`}>
      <EditableBanner articleId={article?.id} url={article.headerUrl} onSave={(updatedUrl) => addArticleMutation.mutate({ ...article, headerUrl: updatedUrl })} />
      <EditablePageHeader key={article?.id} title={article?.name ?? ''} onSave={(updatedTitle) => addArticleMutation.mutate({ ...article, name: updatedTitle })} />
      <EditableTags article={article} tags={queryTags.data ?? []} />
      <main className={styles.main}>
        {
          article ? <Notes article={article} /> : undefined
        }
      </main>
    </div>
  )
}

export default ArticlePage
