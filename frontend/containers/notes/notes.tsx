import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'

import { Accordion } from '../../components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertSubTopic, deleteSubTopic } from '../../lib/firestore/sub-topics'
import { Note } from '../../schema/page'

import styles from './notes.module.scss'

interface NotesProps {
  notes: Note[]
  pageId: string
}

const Notes = (props: NotesProps) => {
  const { user } = useUser()
  const [notes, setNotes] = useState<Note[]>(props.notes)
  const [newNote, setNewNote] = useState<Note | undefined>()

  useEffect(() => {
    setNotes(props.notes)
  }, [props.notes])

  const initialNewSubTopic: Note = {
    id: nanoid(10),
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
    setNotes(notes)
  }

  const accordions = notes
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((subTopic) => (
      <Accordion
        key={subTopic.id}
        name={subTopic.name}
        text={subTopic.text}
        modificationEnabled={!!user}
        onUpdate={(updated) => {
          const updatedSubTopic = { ...subTopic, ...updated }
          upsertSubTopic(updatedSubTopic, props.pageId)
          updateNoteInState(updatedSubTopic)
        }}
        onDelete={() => {
          deleteSubTopic(subTopic)
          removeNoteFromState(subTopic.id || '')
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
          await upsertSubTopic(updated, props.pageId)
          addNoteToState({ ...(updated as Note) })
          setNewNote(undefined)
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {newNote || !user ? undefined : (
          <Button icon="add" onClick={() => setNewNote(initialNewSubTopic)}>
            Voeg spiekbriefje toe
          </Button>
        )}
      </div>
      <div className={styles.grid}>{accordions}</div>
    </div>
  )
}

export default Notes
