'use client'
import { nanoid } from 'nanoid'
import { createContext, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import { Accordion } from '../../components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertNote, deleteNote, getArticle } from '../../lib/firestore/articles'
import { getArticleQueryKey } from '../../lib/react-query'
import { Article, Note } from '../../schema/article'
import { useArticles } from '../../lib/hooks/articles'
import { indexNote, deleteNoteFromIndex, deleteArticleNotesFromIndex } from '../../lib/search/manage-index'

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

  const onDeletePage = () => {
    if (window.confirm("Weet je zeker dat je deze pagina wilt verwijderen?")) {
      // Delete all notes from search index before deleting article
      deleteArticleNotesFromIndex(article.id)
      deleteArticleMutation.mutate(article.id)
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

  const upsertNoteMutation = useMutation(
    (newNote: Note) => upsertNote(newNote, article.id),
    {
      onSuccess: async upsertedNote => {
        if (upsertedNote) {
          queryClient.setQueryData(articleQueryKey, {
            ...article,
            notes: {
              ...article.notes,
              [upsertedNote.id]: upsertedNote
            }
          })
          // Update search index
          await indexNote(upsertedNote, article)
        }
      }
    }
  )

  const deleteNoteMutation = useMutation(
    (noteId: string) => deleteNote(noteId, article.id),
    {
      onSuccess: async deletedNoteId => {
        if (deletedNoteId && article?.notes) {
          delete article.notes[deletedNoteId]
          queryClient.setQueryData(articleQueryKey, { ...article })
          // Remove from search index
          await deleteNoteFromIndex(deletedNoteId)
        }
      }
    }
  )

  const accordions = Object.values(article?.notes ?? [])
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((note) => (
      <Accordion
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
    accordions.unshift(
      <Accordion
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
            ...updated
          }
          upsertNoteMutation.mutate(noteToUpsert)
          setNewNote(undefined)
        }}
      />
    )
  }

  return (
    <ArticleContext.Provider value={article.id}>
      <div className={styles.container}>
        <div className={styles.buttons}>
          {newNote || !user?.hasContributeRights() ? undefined : (
            <>
              <Button icon="add" onClick={() => setNewNote(initialNewNote)}>
                onderwerp toevoegen
              </Button>
              <Button icon="delete" onClick={onDeletePage}>
                verwijder pagina
              </Button>
            </>
          )}
        </div>
        <div className={styles.grid}>{accordions}</div>
      </div>
    </ArticleContext.Provider>
  )
}

export default Notes
