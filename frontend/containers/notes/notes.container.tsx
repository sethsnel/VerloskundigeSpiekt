'use client'
import { nanoid } from 'nanoid'
import { createContext, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import { Accordion } from '@/components/ui/accordion'

import { ArticleAccordion } from '@/components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertNote, deleteNote, getArticle } from '../../lib/firestore/articles'
import { getArticleQueryKey } from '../../lib/react-query'
import { Article, Note } from '../../schema/article'
import { useArticles } from '../../lib/hooks/articles'
import { deleteArticleNotesFromIndexApi, deleteNoteFromIndexApi, indexArticleNotesApi } from '../../lib/services/search-api-client'

import styles from './notes.module.scss'

interface NotesProps {
  article: Article
}

export const ArticleContext = createContext<string | undefined>(undefined)

const Notes = ({ article }: NotesProps) => {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const articleQueryKey = getArticleQueryKey(article.id || '')
  const { deleteArticleMutation } = useArticles()

  const onDeletePage = async () => {
    if (window.confirm('Weet je zeker dat je deze pagina wilt verwijderen?')) {
      // Delete all notes from search index before deleting article
      deleteArticleMutation.mutate(article.id)
      await deleteArticleNotesFromIndexApi(article.id)
    }
  }

  const [newNote, setNewNote] = useState<Note | undefined>()

  const initialNewNote: Note = {
    id: nanoid(20),
    name: 'Nieuw sub-onderwerp',
    text: '<h2>Nieuw kopje</h2><p>Nieuwe tekst</p>',
  }
  const onCancel = () => {
    setNewNote(undefined)
  }

  const upsertNoteMutation = useMutation((newNote: Note) => upsertNote(newNote, article.id), {
    onSuccess: async (upsertedNote) => {
      if (upsertedNote) {
        const updatedArticle = {
          ...article,
          notes: {
            ...article.notes,
            [upsertedNote.id]: upsertedNote,
          },
        }

        queryClient.setQueryData(articleQueryKey, updatedArticle)
        // Update search index
        await indexArticleNotesApi(updatedArticle.id)
      }
    },
  })

  const deleteNoteMutation = useMutation((noteId: string) => deleteNote(noteId, article.id), {
    onSuccess: async (deletedNoteId) => {
      if (deletedNoteId && article?.notes) {
        delete article.notes[deletedNoteId]
        queryClient.setQueryData(articleQueryKey, { ...article })
        // Remove from search index
        await deleteNoteFromIndexApi(deletedNoteId)
      }
    },
  })

  const accordionItems = Object.values(article?.notes ?? [])
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((note) => (
      <ArticleAccordion
        key={note.id}
        id={note.id}
        name={note.name}
        text={note.text}
        json={note.json ?? []}
        modificationEnabled={user?.hasContributeRights()}
        onUpdate={(updated) => {
          const updatedNote = { ...note, ...updated }
          upsertNoteMutation.mutate(updatedNote)
        }}
        onDelete={() => {
          deleteNoteMutation.mutate(note.id)
        }}
      />
    ))

  if (newNote) {
    accordionItems.unshift(
      <ArticleAccordion
        key="new"
        name={newNote.name}
        text={newNote.text}
        json={newNote.json ?? []}
        editMode={true}
        modificationEnabled={true}
        onCancel={onCancel}
        onUpdate={async (updated) => {
          const noteToUpsert = {
            id: newNote.id,
            ...updated,
          }
          upsertNoteMutation.mutate(noteToUpsert)
          setNewNote(undefined)
        }}
      />,
    )
  }

  return (
    <ArticleContext.Provider value={article.id}>
      <div className={styles.container}>
        <div className={styles.buttons}>
          {newNote || !user?.hasContributeRights() ? undefined : (
            <>
              <Button variant="outline" icon="add" onClick={() => setNewNote(initialNewNote)}>
                onderwerp toevoegen
              </Button>
              <Button variant="ghost" icon="delete" onClick={onDeletePage}>
                verwijder pagina
              </Button>
            </>
          )}
        </div>
        <Accordion type="multiple" className="w-full">
          {accordionItems}
        </Accordion>
      </div>
    </ArticleContext.Provider>
  )
}

export default Notes
