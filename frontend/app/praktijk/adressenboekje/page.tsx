'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/auth/use-user'
import usePraktijken from '@/lib/hooks/praktijken/use-praktijken'
import usePraktijkResources from '@/lib/hooks/praktijken/use-praktijk-resources'

const AdressenboekjePage = () => {
  const { user } = useUser()
  const { activePraktijkQuery, praktijkenQuery } = usePraktijken(user?.id)
  const activePraktijkId = activePraktijkQuery.data?.activePraktijkId ?? ''
  const { addressesQuery, addAddressMutation } = usePraktijkResources(activePraktijkId)

  const activePraktijk = useMemo(
    () => praktijkenQuery.data?.find((praktijk) => praktijk.id === activePraktijkId),
    [praktijkenQuery.data, activePraktijkId]
  )

  const [form, setForm] = useState({
    name: '',
    addressLine1: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    notes: '',
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activePraktijkId || !form.name.trim()) return

    addAddressMutation.mutate({
      praktijkId: activePraktijkId,
      name: form.name.trim(),
      addressLine1: form.addressLine1,
      postalCode: form.postalCode,
      city: form.city,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
    })

    setForm({
      name: '',
      addressLine1: '',
      postalCode: '',
      city: '',
      phone: '',
      email: '',
      notes: '',
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/praktijk" className="text-primary underline">Terug naar praktijk</Link>
        </p>
        <h1 className="text-3xl font-semibold">Adressenboekje</h1>
        <p className="text-sm text-muted-foreground">
          Deel adressen van huisartsen en ketenpartners binnen je praktijk.
        </p>
      </header>

      <section className="rounded-lg border border-muted bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Actieve praktijk</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {activePraktijk ? activePraktijk.name : 'Geen actieve praktijk geselecteerd.'}
        </p>
      </section>

      <section className="rounded-lg border border-muted bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Nieuw adres</h2>
        {!activePraktijkId ? (
          <p className="mt-2 text-sm text-muted-foreground">Selecteer eerst een praktijk op de dashboardpagina.</p>
        ) : (
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressName">Naam</Label>
              <Input
                id="addressName"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Naam van de praktijk of huisarts"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Adresregel</Label>
              <Input
                id="addressLine1"
                value={form.addressLine1}
                onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
                placeholder="Straat en huisnummer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressPostal">Postcode</Label>
              <Input
                id="addressPostal"
                value={form.postalCode}
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                placeholder="1234 AB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCity">Plaats</Label>
              <Input
                id="addressCity"
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="Plaats"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressPhone">Telefoon</Label>
              <Input
                id="addressPhone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Telefoonnummer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressEmail">E-mail</Label>
              <Input
                id="addressEmail"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="contact@praktijk.nl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressNotes">Notities</Label>
              <Input
                id="addressNotes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Opmerkingen"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={addAddressMutation.isLoading}>
                Adres toevoegen
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-muted bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Gedeelde adressen</h2>
        {!activePraktijkId ? (
          <p className="mt-2 text-sm text-muted-foreground">Selecteer eerst een praktijk.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {(addressesQuery.data ?? []).map((address) => (
              <li key={address.id} className="space-y-1 border-b border-dashed border-muted pb-3 last:border-none last:pb-0">
                <p className="font-medium">{address.name}</p>
                <p className="text-muted-foreground">{address.addressLine1}</p>
                <p className="text-muted-foreground">{[address.postalCode, address.city].filter(Boolean).join(' ')}</p>
                <p className="text-muted-foreground">{address.phone}</p>
                <p className="text-muted-foreground">{address.email}</p>
                {address.notes ? <p className="text-muted-foreground">{address.notes}</p> : null}
              </li>
            ))}
            {(addressesQuery.data ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">Nog geen adressen toegevoegd.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AdressenboekjePage
