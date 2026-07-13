'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './search.module.scss'

import { Content } from '../../components/layout'
import { generatedApi, type ApiSearchResponse } from '../../lib/api/generated'
import { Button } from '../../components/button'
import SearchBar from '@/components/layout/search-bar'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<ApiSearchResponse['items']>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [total, setTotal] = useState<number>(0)
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [page, setPage] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
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

        const searchResults = await generatedApi.search(query, cursors[page], pageSize)
        setResults(searchResults.items)
        setNextCursor(searchResults.nextCursor)
        setTotal(Object.values(searchResults.facets).reduce((sum, count) => sum + count, 0))
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
  }, [cursors, page, query])

  const handlePageChange = (newPage: number) => {
    if (newPage > page && nextCursor) setCursors(current => [...current.slice(0, page + 1), nextCursor])
    setPage(newPage)
    // Scroll to top when changing pages
    window.scrollTo(0, 0)
  }

  return (
    <Content>
      <div className={`${styles.searchResultsContainer} w-full`}>
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
                    <Link href={result.kind === 'article' ? `/artikel/${result.snippet}` : `/praktijk/${result.snippet}`}>
                      {result.title}
                    </Link>
                  </h2>
                  <p className={styles.noteContent}>
                    {result.snippet}
                  </p>
                </div>
              ))}
            </div>

            {(page > 0 || nextCursor) && (
              <div className={styles.pagination}>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  icon='back'
                >
                  Vorige
                </Button>
                <span className={styles.pageInfo}>
                  Pagina {page + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!nextCursor}
                  icon='forward'
                >
                  Volgende
                </Button>
              </div>
            )}

            <div className={styles.resultsCount}>Totaal aantal resultaten: {total}</div>
          </>
        ) : (
          <div className={styles.loading}>Geen resultaten gevonden {query && query !== '' && (`voor "${query}"`)}</div>
        )}
      </div>
    </Content>
  )
}
