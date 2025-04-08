import { adminClient, searchClient, searchIndexSchema, noteToSearchable, SearchableNote } from './search-client'
import { Article, Note } from '../../schema/article'
import { getArticles } from '../firestore/articles'

export async function ensureSearchIndex() {
  // Check if index exists
  let indexExists = false
  let isDone = false
  const indexList = await adminClient.listIndexes()

  while (!isDone) {
    const nextIndex = await indexList.next()

    if (nextIndex.value && nextIndex.value.name === searchIndexSchema.name) {
      indexExists = true
      break
    }

    isDone = nextIndex.done ?? true
  }

  if (!indexExists) {
    console.log(`Creating search index ${searchIndexSchema.name}...`)
    await adminClient.createIndex(searchIndexSchema)
  }
}

export async function indexAllNotes(article: Article) {
  // First ensure index exists
  await ensureSearchIndex()

  // Convert notes to searchable documents
  const documents = Object.values(article.notes || {}).map(note => noteToSearchable(note, article))

  // Upload documents in batches of 50
  const batchSize = 50
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    await searchClient.uploadDocuments(batch)
  }

  console.log(`Indexed ${documents.length} notes from article ${article.name}`)
}

export async function indexNote(note: Note, article: Article) {
  await ensureSearchIndex()
  const document = noteToSearchable(note, article)
  await searchClient.uploadDocuments([document])
}

export async function deleteNoteFromIndex(noteId: string) {
  // We only need to specify the key field (id) when deleting
  await searchClient.deleteDocuments([{ id: noteId } as SearchableNote])
}

export async function deleteArticleNotesFromIndex(articleId: string) {
  // Delete all notes belonging to this article
  await searchClient.search("", {
    filter: `articleId eq '${articleId}'`,
    select: ["id"]
  }).then(async results => {
    const noteIds: string[] = []
    for await (const result of results.results) {
      if (result.document?.id) {
        noteIds.push(result.document.id)
      }
    }
    if (noteIds.length > 0) {
      // We only need to specify the key field (id) when deleting
      await searchClient.deleteDocuments(noteIds.map(id => ({ id } as SearchableNote)))
    }
  })
}

export async function reindexAllNotes(options: {
  deleteExisting?: boolean,
  onProgress?: (indexed: number, total: number) => void
} = {}) {
  const { deleteExisting = true, onProgress } = options

  // First ensure index exists
  await ensureSearchIndex()

  // If requested, delete existing index
  if (deleteExisting) {
    try {
      await adminClient.deleteIndex(searchIndexSchema.name)
      await ensureSearchIndex()
    } catch (error) {
      console.error('Error deleting index:', error)
    }
  }

  // Get all articles
  const articles = await getArticles()
  let totalNotes = 0
  let indexedNotes = 0

  // Count total notes first for progress tracking
  articles.forEach(article => {
    totalNotes += Object.keys(article.notes || {}).length
  })

  // Process each article's notes
  for (const article of articles) {
    const notes = Object.values(article.notes || {})
    const documents = notes.map(note => noteToSearchable(note, article))

    // Upload documents in batches of 50
    const batchSize = 50
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      await searchClient.uploadDocuments(batch)
      indexedNotes += batch.length

      if (onProgress) {
        onProgress(indexedNotes, totalNotes)
      }
    }
  }

  console.log(`Reindexing complete. Indexed ${indexedNotes} notes from ${articles.length} articles.`)
  return { totalNotes: indexedNotes, totalArticles: articles.length }
}