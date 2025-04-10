'use client'

import { useState } from 'react'
import { Button } from '../button'
import { useUser } from '../../lib/auth/use-user'

export default function ReindexButton() {
  const { user } = useUser()
  const [isReindexing, setIsReindexing] = useState(false)
  const [result, setResult] = useState<{ totalNotes: number; totalArticles: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReindex = async () => {
    if (!confirm('Weet je zeker dat je alle notities opnieuw wilt indexeren?')) {
      return
    }

    setIsReindexing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/reindex', {
        method: 'POST',
        headers: { 'vs-auth-token': user?.idToken || '' },
      })

      if (!response.ok) {
        throw new Error('Failed to reindex')
      }

      const data = await response.json()
      setResult(data)
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
        onClick={handleReindex}
        disabled={isReindexing}
        icon={isReindexing ? undefined : 'edit'}
      >
        {isReindexing ? 'Bezig met indexeren...' : 'Herindexeer alle notities'}
      </Button>

      {result && (
        <div className="alert alert-success">
          {result.totalNotes} notities van {result.totalArticles} artikelen zijn geïndexeerd
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  )
}
