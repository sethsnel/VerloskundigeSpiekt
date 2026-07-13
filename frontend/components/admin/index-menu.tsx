'use client'

import { useState } from 'react'

import { generatedApi } from '@/lib/api/generated'

import { Button } from '../button'

export default function IndexMenu() {
  const [isReindexing, setIsReindexing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const indexMenu = async () => {
    setError(null)
    setIsReindexing(true)
    try {
      const articles = await generatedApi.listArticles()
      await Promise.all(articles.map((article, position) => generatedApi.updateArticle(article.id, { slug: article.slug, title: article.title, position, headerUrl: article.headerUrl, isPublished: article.isPublished, sections: article.sections.map(section => ({ heading: section.heading, documentJson: section.documentJson })), tagIds: article.tagIds }, article.version)))
    } catch {
      setError('Er is een fout opgetreden bij het indexeren')
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
