import { validateAdminRequest } from '../../../../lib/server'
import { reindexAllNotes } from '../../../../lib/search/manage-index'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const requestResponseCode = await validateAdminRequest()
  if (requestResponseCode !== 200) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: requestResponseCode })
  }

  try {
    const result = await reindexAllNotes({
      deleteExisting: true
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error reindexing notes:', error)
    return NextResponse.json(
      { error: 'Failed to reindex notes' },
      { status: 500 }
    )
  }
}