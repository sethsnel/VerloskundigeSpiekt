import { nanoid } from 'nanoid'
import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import { Accordion } from '../../components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertNote, deleteNote, getArticle } from '../../lib/firestore/articles'
import { getArticleQueryKey } from '../../lib/react-query'
import { Article, Note } from '../../schema/article'
import { useArticles } from '../../lib/hooks/articles'

import styles from './notes.module.scss'

interface NotesProps {
  article: Article
}

const Notes = ({ article }: NotesProps) => {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const articleQueryKey = getArticleQueryKey(article.id || '')
  const { deleteArticleMutation } = useArticles()

  const onDeletePage = () => {
    if (window.confirm("Weet je zeker dat je deze pagina wilt verwijderen?")) {
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
      onSuccess: upsertedNote => {
        if (upsertedNote) {
          queryClient.setQueryData(articleQueryKey, {
            ...article,
            notes: {
              ...article.notes,
              [upsertedNote.id]: upsertedNote
            }
          })
        }
      }
    }
  )

  const deleteNoteMutation = useMutation(
    (noteId: string) => deleteNote(noteId, article.id),
    {
      onSuccess: deletedNoteId => {
        if (deletedNoteId && article?.notes) {
          delete article.notes[deletedNoteId]
          queryClient.setQueryData(articleQueryKey, { ...article })
        }
      }
    }
  )

  const accordions = Object.values(article?.notes ?? [])
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((note) => (
      <Accordion
        key={note.id}
        name={note.name}
        text={note.text}
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
  )
}

export default Notes
