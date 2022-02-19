import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'

import { Accordion } from '../../components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertNote, deleteNote } from '../../lib/firestore/articles'
import { Note } from '../../schema/article'

import styles from './notes.module.scss'

interface NotesProps {
  notes: Note[]
  articleId: string
}

const Notes = (props: NotesProps) => {
  const { user } = useUser()
  const [notes, setNotes] = useState<Note[]>(props.notes)
  const [newNote, setNewNote] = useState<Note | undefined>()

  useEffect(() => {
    setNotes(props.notes)
  }, [props.notes])

  const initialNewNote: Note = {
    id: nanoid(20),
    name: 'Nieuw sub-onderwerp',
    text: '<h2>Nieuw kopje</h2><p>Nieuwe tekst</p>',
  }
  const onCancel = () => {
    setNewNote(undefined)
  }
  const removeNoteFromState = (noteId: string) => {
    setNotes(notes.filter((st) => st.id !== noteId))
  }
  const addNoteToState = (note: Note) => {
    setNotes([note, ...notes])
  }
  const updateNoteInState = (note: Note) => {
    const index = notes.findIndex((st) => st.id === note.id)
    notes[index] = note
    //Want sorting on change name? [...notes.sort((a, b) => a.name.localeCompare(b.name))]
    setNotes(notes)
  }

  const accordions = notes
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((note) => (
      <Accordion
        key={note.id}
        name={note.name}
        text={note.text}
        modificationEnabled={!!user}
        onUpdate={(updated) => {
          const updatedNote = { ...note, ...updated }
          upsertNote(updatedNote, props.articleId)
          updateNoteInState(updatedNote)
        }}
        onDelete={() => {
          deleteNote(note.id, props.articleId)
          removeNoteFromState(note.id || '')
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
          await upsertNote(noteToUpsert, props.articleId)
          addNoteToState({ ...(noteToUpsert) })
          setNewNote(undefined)
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {newNote || !user ? undefined : (
          <Button icon="add" onClick={() => setNewNote(initialNewNote)}>
            maak spiekbriefje
          </Button>
        )}
      </div>
      <div className={styles.grid}>{accordions}</div>
    </div>
  )
}

export default Notes
