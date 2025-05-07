'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch } from 'react-icons/fi'
import styles from './search-bar.module.scss'

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    // Redirect to search results page with the search term as a query parameter
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Zoeken..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          aria-label="Zoeken"
        />
        <button type="submit" className={styles.searchButton} aria-label="Zoeken">
          <FiSearch />
          <span className={styles['visually-hidden']}>Zoeken</span>
        </button>
      </form>
    </div>
  )
}

export default SearchBar