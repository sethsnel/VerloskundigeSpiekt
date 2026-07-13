'use client'
import { nanoid } from 'nanoid'
import { createContext, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import { Accordion } from '@/components/ui/accordion'

import { ArticleAccordion } from '@/components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { getArticleQueryKey } from '../../lib/react-query'
import { Article, Note } from '../../schema/article'
import { useArticles } from '../../lib/hooks/articles'

import styles from './notes.module.scss'

interface NotesProps {
  article: Article
}

export const ArticleContext = createContext<string | undefined>(undefined)

const Notes = ({ article }: NotesProps) => {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const articleQueryKey = getArticleQueryKey(article.id || '')
  const { deleteArticleMutation, addArticleMutation } = useArticles()
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([])

  const onDeletePage = async () => {
    if (window.confirm('Weet je zeker dat je deze pagina wilt verwijderen?')) {
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

  const upsertNoteMutation = useMutation(async (newNote: Note) => { await addArticleMutation.mutateAsync({ ...article, notes: { ...article.notes, [newNote.id]: newNote } }); return newNote }, {
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
      }
    },
  })

  const deleteNoteMutation = useMutation(async (noteId: string) => { const notes = { ...article.notes }; delete notes[noteId]; await addArticleMutation.mutateAsync({ ...article, notes }); return noteId }, {
    onSuccess: async (deletedNoteId) => {
      if (deletedNoteId && article?.notes) {
        delete article.notes[deletedNoteId]
        queryClient.setQueryData(articleQueryKey, { ...article })
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
        id={newNote.id}
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
              <Button variant="outline" icon="add" onClick={() => { setNewNote(initialNewNote); setOpenAccordionItems([...openAccordionItems, initialNewNote.id]) }}>
                onderwerp toevoegen
              </Button>
              <Button variant="ghost" icon="delete" onClick={onDeletePage}>
                verwijder pagina
              </Button>
            </>
          )}
        </div>
        <Accordion className="w-full" type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems}>
          {accordionItems}
        </Accordion>
      </div>
    </ArticleContext.Provider>
  )
}

export default Notes
