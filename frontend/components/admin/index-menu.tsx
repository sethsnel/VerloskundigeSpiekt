'use client'

import { useState } from 'react'

import { doc, setDoc } from 'firebase/firestore'
import { firestoreDb } from 'config/firebaseConfig'
import revalidatePath from '@/lib/firestore/articles/revalidate'
import { getArticles } from '@/lib/firestore/articles'

import { Button } from '../button'

export default function IndexMenu() {
  const [isReindexing, setIsReindexing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const indexMenu = async () => {
    setError(null)
    setIsReindexing(true)
    const menuItems = await getArticles()

    try {
      const menuArticlesRef = doc(firestoreDb, 'menu', 'articles')
      await setDoc(
        menuArticlesRef,
        menuItems.reduce((acc, item) => {
          acc[item.id] = item.name
          return acc
        }, {} as Record<string, string>)
      )
      revalidatePath('/', 'layout')
    } catch (err) {
      setError('Er is een fout opgetreden bij het indexeren')
      console.error('Reindex error:', err)
    } finally {
      setIsReindexing(false)
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      <Button
        variant="outline"
        onClick={indexMenu}
        disabled={isReindexing}
        icon={isReindexing ? undefined : 'edit'}
      >
        {isReindexing ? 'Bezig met indexeren...' : 'Herindexeer menu'}
      </Button>

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  )
}
