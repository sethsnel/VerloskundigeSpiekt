import { NextRequest, NextResponse } from 'next/server'
import { indexArticleNotes } from '../../../../lib/search/manage-index'

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    await indexArticleNotes(articleId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error indexing article notes:', error)
    return NextResponse.json(
      { error: 'Failed to index article notes' },
      { status: 500 }
    )
  }
}