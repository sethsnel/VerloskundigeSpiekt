import { Metadata } from 'next'
import Link from 'next/link'
import { getTags } from '../../lib/firestore/tags'
import styles from './tags.module.scss'

export const metadata: Metadata = {
  title: 'Alle Tags',
  description: 'Bladeren door alle tags en onderwerpen',
}

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Alle Tags</h1>

      <div className={styles.tagGrid}>
        {tags.map(tag => (
          <Link
            href={`/tags/${tag.id}`}
            key={tag.id}
            className={styles.tagCard}
          >
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{tag.name}</h5>
                <p className="card-text">
                  {tag.articles?.length || 0} artikelen
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {tags.length === 0 && (
        <p>Geen tags gevonden.</p>
      )}
    </div>
  )
}
