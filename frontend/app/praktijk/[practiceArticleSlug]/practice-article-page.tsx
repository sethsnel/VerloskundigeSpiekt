'use client'

import Link from 'next/link'
import { nanoid } from 'nanoid'
import { useState } from 'react'

import { ArticleAccordion } from '../../../components/accordion'
import { PracticeHeader, PracticeLinks } from '../../../components/practices'
import { Accordion } from '../../../components/ui/accordion'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { useUser } from '../../../lib/auth/use-user'
import { PRACTICE_ARTICLE_TITLES } from '../../../lib/firestore/practices/constants'
import { usePracticeArticle, usePractices } from '../../../lib/hooks/practices'
import { Note } from '../../../schema/article'

const allowedSlugs = Object.keys(PRACTICE_ARTICLE_TITLES)

const PracticeArticlePage = ({ slug }: { slug: string }) => {
  const { user } = useUser()
  const { activePracticeQuery } = usePractices(user)
  const activePractice = activePracticeQuery.data
  const { articleQuery, upsertArticleMutation, upsertNoteMutation, deleteNoteMutation } = usePracticeArticle(activePractice?.id, slug)
  const [newNote, setNewNote] = useState<Note | undefined>()
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([])

  if (!allowedSlugs.includes(slug)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Praktijkpagina niet gevonden</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/praktijk">Terug naar praktijk</Link>
        </Button>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">{PRACTICE_ARTICLE_TITLES[slug]}</h1>
        <p className="my-4">Log in om praktijkgegevens te bekijken.</p>
        <Button asChild>
          <Link href="/login">Aanmelden</Link>
        </Button>
      </main>
    )
  }

  if (activePracticeQuery.isLoading || articleQuery.isLoading) {
    return <main className="mx-auto max-w-4xl px-4 py-8">Praktijkpagina laden...</main>
  }

  if (!activePractice) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">{PRACTICE_ARTICLE_TITLES[slug]}</h1>
        <p className="my-4">Kies of registreer eerst een praktijk.</p>
        <Button asChild>
          <Link href="/praktijk">Naar praktijk</Link>
        </Button>
      </main>
    )
  }

  const article = articleQuery.data

  if (!article) {
    return <main className="mx-auto max-w-4xl px-4 py-8">Geen praktijkpagina gevonden.</main>
  }

  const initialNewNote: Note = {
    id: nanoid(20),
    name: 'Nieuw sub-onderwerp',
    text: '<h2>Nieuw kopje</h2><p>Nieuwe tekst</p>',
  }

  const accordionItems = Object.values(article.notes ?? {})
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((note) => (
      <ArticleAccordion
        key={note.id}
        id={note.id}
        name={note.name}
        text={note.text}
        json={note.json ?? []}
        modificationEnabled={true}
        onUpdate={(updated) => {
          upsertNoteMutation.mutate({ ...note, ...updated })
        }}
        onDelete={() => deleteNoteMutation.mutate(note.id)}
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
        onCancel={() => setNewNote(undefined)}
        onUpdate={(updated) => {
          upsertNoteMutation.mutate({ id: newNote.id, ...updated })
          setNewNote(undefined)
        }}
      />
    )
  }

  return (
    <main className="flex max-w-6xl flex-col gap-6 px-4 py-8">
      <PracticeHeader practiceName={activePractice.name} />
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/praktijk">Terug naar praktijk</Link>
        </Button>
        <PracticeLinks className="flex flex-wrap gap-2" />
      </div>
      <EditablePracticeTitle
        title={article.name}
        onSave={(name) => upsertArticleMutation.mutate({ ...article, name })}
      />
      <div className="flex justify-end">
        {!newNote && (
          <Button
            variant="outline"
            onClick={() => {
              setNewNote(initialNewNote)
              setOpenAccordionItems([...openAccordionItems, initialNewNote.id])
            }}
          >
            onderwerp toevoegen
          </Button>
        )}
      </div>
      <Accordion className="w-full" type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems}>
        {accordionItems}
      </Accordion>
    </main>
  )
}

const EditablePracticeTitle = ({ title, onSave }: { title: string, onSave: (title: string) => void }) => {
  const [editMode, setEditMode] = useState(false)
  const [updatedTitle, setUpdatedTitle] = useState(title)

  if (editMode) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xl text-2xl font-semibold"
          autoFocus
          value={updatedTitle}
          onChange={(event) => setUpdatedTitle(event.target.value)}
        />
        <Button
          onClick={() => {
            setEditMode(false)
            onSave(updatedTitle)
          }}
        >
          opslaan
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setUpdatedTitle(title)
            setEditMode(false)
          }}
        >
          annuleren
        </Button>
      </div>
    )
  }

  return (
    <h1 className="cursor-pointer text-3xl font-semibold leading-none" onClick={() => setEditMode(true)}>
      {title}
    </h1>
  )
}

export default PracticeArticlePage
