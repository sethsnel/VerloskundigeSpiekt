import { NextRequest, NextResponse } from 'next/server'
import { deleteNoteFromIndex } from '../../../../lib/search/manage-index'

export async function DELETE(request: NextRequest) {
  try {
    const { noteId } = await request.json()

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    await deleteNoteFromIndex(noteId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note from index:', error)
    return NextResponse.json(
      { error: 'Failed to delete note from index' },
      { status: 500 }
    )
  }
}