'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/auth/use-user'
import {
  useActivePraktijk,
  useAddAddressBookEntry,
  useAddressBookEntries,
  usePraktijken,
} from '@/lib/hooks/praktijken/usePraktijken'
import type { PraktijkAddressBookEntry } from '../../../schema/praktijk'

const emptyEntry: Omit<PraktijkAddressBookEntry, 'id' | 'createdAt'> = {
  name: '',
  addressLine: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
  notes: '',
  createdBy: '',
}

export default function AdressenboekjePage() {
  const { user } = useUser()
  const praktijkenQuery = usePraktijken(user?.id)
  const activePraktijkQuery = useActivePraktijk(user?.id)

  const activePraktijkId = activePraktijkQuery.data ?? null
  const activePraktijk = useMemo(
    () => (praktijkenQuery.data ?? []).find((praktijk) => praktijk.id === activePraktijkId) ?? null,
    [praktijkenQuery.data, activePraktijkId],
  )

  const entriesQuery = useAddressBookEntries(activePraktijkId ?? undefined)
  const addEntryMutation = useAddAddressBookEntry(activePraktijkId ?? undefined)

  const [formState, setFormState] = useState(emptyEntry)

  if (!user) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">Adressenboekje</h1>
        <p>Je moet ingelogd zijn om adressen te beheren.</p>
        <Button asChild>
          <Link href="/login">Inloggen</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!activePraktijkId) return

    await addEntryMutation.mutateAsync({
      ...formState,
      createdBy: user.id,
    })

    setFormState({ ...emptyEntry, createdBy: '' })
  }

  return (
    <div className="max-w-5xl space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Adressenboekje</h1>
        <p className="text-muted-foreground">
          Deel adressen van huisartsen of andere zorgpartners met je praktijk.
        </p>
      </header>

      {!activePraktijk && (
        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <p className="text-muted-foreground">
            Selecteer eerst een actieve praktijk in het <Link href="/praktijk" className="underline">praktijkoverzicht</Link>.
          </p>
        </section>
      )}

      {activePraktijk && (
        <section className="space-y-4 rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">{activePraktijk.name}</h2>
              <p className="text-sm text-muted-foreground">Actieve praktijk</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/praktijk">Terug naar praktijk</Link>
            </Button>
          </div>
        </section>
      )}

      {activePraktijk && (
        <section className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Nieuw adres toevoegen</h2>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="entry-name">Naam praktijk of huisarts</Label>
              <Input
                id="entry-name"
                value={formState.name}
                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                placeholder="Huisartsenpraktijk De Linde"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-address">Adres</Label>
              <Input
                id="entry-address"
                value={formState.addressLine}
                onChange={(event) => setFormState({ ...formState, addressLine: event.target.value })}
                placeholder="Straatnaam 10"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="entry-postal">Postcode</Label>
                <Input
                  id="entry-postal"
                  value={formState.postalCode}
                  onChange={(event) => setFormState({ ...formState, postalCode: event.target.value })}
                  placeholder="1234 AB"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-city">Plaats</Label>
                <Input
                  id="entry-city"
                  value={formState.city}
                  onChange={(event) => setFormState({ ...formState, city: event.target.value })}
                  placeholder="Rotterdam"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="entry-phone">Telefoon</Label>
                <Input
                  id="entry-phone"
                  value={formState.phone}
                  onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                  placeholder="010 123 45 67"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-email">E-mail</Label>
                <Input
                  id="entry-email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                  placeholder="contact@huisarts.nl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-notes">Notities</Label>
              <Input
                id="entry-notes"
                value={formState.notes}
                onChange={(event) => setFormState({ ...formState, notes: event.target.value })}
                placeholder="Extra informatie"
              />
            </div>
            <Button type="submit" disabled={addEntryMutation.isLoading}>
              Adres opslaan
            </Button>
          </form>
        </section>
      )}

      {activePraktijk && (
        <section className="space-y-4 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Gedeelde adressen</h2>
          <div className="grid gap-3">
            {(entriesQuery.data ?? []).map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-muted/10 p-4">
                <h3 className="font-semibold">{entry.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {entry.addressLine}, {entry.postalCode} {entry.city}
                </p>
                {(entry.phone || entry.email) && (
                  <p className="text-sm text-muted-foreground">
                    {entry.phone && <span>Tel: {entry.phone}</span>}
                    {entry.phone && entry.email && <span> · </span>}
                    {entry.email && <span>E-mail: {entry.email}</span>}
                  </p>
                )}
                {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
              </div>
            ))}
            {(entriesQuery.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nog geen adressen toegevoegd.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
