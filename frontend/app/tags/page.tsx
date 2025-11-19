import { Metadata } from 'next'
import Link from 'next/link'

import { getTags } from '../../lib/firestore/tags'
import { getArticlesWithoutTags } from '../../lib/firestore/articles'
import styles from './tags.module.scss'
import { Button } from '../../components/button'
import { getChannelLabels } from 'content/labels'

const labels = getChannelLabels()

export const metadata: Metadata = {
  title: `${labels.websiteTitle} - tags`,
  description: 'Bladeren door alle tags en onderwerpen',
}

export default async function TagsPage() {
  const tags = await getTags()
  const untaggedArticles = await getArticlesWithoutTags()

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Alle Tags</h1>
        {untaggedArticles.length > 0 && (
          <Link href="/tags/untagged">
            <Button variant="link">
              Artikelen zonder tags ({untaggedArticles.length})
            </Button>
          </Link>
        )}
      </div>

      <div className={styles.tagGrid}>
        {tags
          .filter(t => t.articles?.length ?? 0 > 0)
          .map(tag => (
            <Link
              href={`/tags/${tag.id}`}
              key={tag.id}
              className={styles.tagCard}
            >
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{tag.name}</h5>
                  <p className="card-text">
                    {tag.articles.length || 0} artikelen
                  </p>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}
