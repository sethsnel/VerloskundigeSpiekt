import { NextRequest, NextResponse } from 'next/server'
import { searchNotes } from '../../../../lib/search/search'

export async function POST(request: NextRequest) {
  try {
    const { query, skip, pageSize, } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    const searchResults = await searchNotes(query, {
      skip: skip ?? 0,
      top: pageSize ?? 10,
      includeFacets: true,
    })

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error('Error indexing article notes:', error)
    return NextResponse.json(
      { error: 'Failed to index article notes' },
      { status: 500 }
    )
  }
}