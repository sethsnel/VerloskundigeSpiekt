'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './search.module.scss'

import { Content } from '../../components/layout'
import { SearchableNote } from '../../lib/search/search-schema'
import { queryIndexApi } from '../../lib/services/search-api-client'
import { Button } from '../../components/button'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchableNote[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 10

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query.trim()) {
        setResults([])
        setLoading(false)
        setTotal(0)
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const skip = (page - 1) * pageSize

        // Use the actual search function
        const searchResults = await queryIndexApi(query, pageSize, skip)

        setResults(searchResults.notes)
        setTotal(searchResults.total)
      } catch (error) {
        console.error('Error searching:', error)
        setError('De zoekservice is momenteel niet beschikbaar. Probeer het later opnieuw.')
        setResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query, page])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Scroll to top when changing pages
    window.scrollTo(0, 0)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Content>
      <div className={styles.searchResultsContainer}>
        <h1>Zoekresultaten voor: &quot;{query}&quot;</h1>

        {loading ? (
          <div className={styles.loading}>Zoeken...</div>
        ) : error ? (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <p>
              Je kunt proberen om <Link href="/">terug te gaan naar de homepagina</Link> of
              handmatig te zoeken via de artikelen.
            </p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className={styles.resultsList}>
              {results.map((result) => (
                <div key={result.id} className={styles.resultItem}>
                  <h2>
                    <Link href={`/artikel/${result.articleId}#${result.noteId}`}>
                      {result.articleName}
                      <span className={styles.articleName}>&nbsp;- {result.name}</span>
                    </Link>
                  </h2>
                  <p className={styles.noteContent}>
                    {result.content.length > 200
                      ? `${result.content.substring(0, 200)}...`
                      : result.content}
                  </p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  icon='back'
                >
                  Vorige
                </Button>
                <span className={styles.pageInfo}>
                  Pagina {page} van {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  icon='forward'
                >
                  Volgende
                </Button>
              </div>
            )}

            <div className={styles.resultsCount}>Totaal aantal resultaten: {total}</div>
          </>
        ) : (
          <div className={styles.noResults}>Geen resultaten gevonden voor &quot;{query}&quot;</div>
        )}
      </div>
    </Content>
  )
}
