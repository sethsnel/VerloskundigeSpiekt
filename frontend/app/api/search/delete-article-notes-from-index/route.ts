import { NextRequest, NextResponse } from 'next/server'
import { deleteArticleNotesFromIndex } from '../../../../lib/search/manage-index'

export async function DELETE(request: NextRequest) {
  try {
    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    await deleteArticleNotesFromIndex(articleId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article notes from index:', error)
    return NextResponse.json(
      { error: 'Failed to delete article notes from index' },
      { status: 500 }
    )
  }
}