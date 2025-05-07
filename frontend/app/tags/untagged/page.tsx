import { Metadata } from 'next'
import Link from 'next/link'

import { getArticlesWithoutTags } from '../../../lib/firestore/articles'
import { Button } from '../../../components/button'

export const metadata: Metadata = {
  title: 'Artikelen zonder tags',
  description: 'Artikelen die nog niet gecategoriseerd zijn',
}

export default async function UntaggedArticlesPage() {
  const articles = await getArticlesWithoutTags()

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Artikelen zonder tags</h1>
        <Link href="/tags">
          <Button className='btn btn-link' icon="back">Alle tags</Button>
        </Link>
      </div>

      {articles.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {articles.map(article => (
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
        <div className="alert alert-info">
          <p className="mb-0">Er zijn geen artikelen zonder tags gevonden.</p>
        </div>
      )}
    </div>
  )
}
