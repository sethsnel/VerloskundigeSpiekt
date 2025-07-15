import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTags } from '../../../lib/firestore/tags'
import { Button } from '../../../components/button'
import styles from './tags.module.scss'

type Props = {
  params: Promise<{ tagId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tagId } = await params
  const tags = await getTags()
  const tag = tags.find(t => t.id === tagId)

  if (!tag) {
    return {
      title: 'Tag niet gevonden',
    }
  }

  return {
    title: `Tag: ${tag.name}`,
    description: `Artikelen gelabeld met ${tag.name}`,
  }
}

export default async function TagPage({ params }: Props) {
  const { tagId } = await params
  const tags = await getTags()
  const tag = tags.find(t => t.id === tagId)

  if (!tag) {
    notFound()
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tag: {tag.name}</h1>
        <Link href="/tags">
          <Button variant="link" icon="back">Alle tags</Button>
        </Link>
      </div>

      <h2>Artikelen met deze tag</h2>

      {tag.articles && tag.articles.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-2">
          {tag.articles.map(article => (
            <div className="col" key={article.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{article.name}</h5>
                  <Link
                    href={`/artikel/${article.id}`}
                    className="btn btn-primary mt-2"
                  >
                    Bekijk artikel
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Geen artikelen gevonden met deze tag.</p>
      )}
    </div>
  )
}
