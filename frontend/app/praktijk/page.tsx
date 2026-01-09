'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/auth/use-user'
import usePraktijken from '@/lib/hooks/praktijken/use-praktijken'
import usePraktijkResources from '@/lib/hooks/praktijken/use-praktijk-resources'
import { PraktijkMemberRole } from '@/schema/praktijk'

const PraktijkPage = () => {
  const { user } = useUser()
  const userId = user?.id
  const { praktijkenQuery, activePraktijkQuery, createPraktijkMutation, setActivePraktijkMutation } =
    usePraktijken(userId)

  const activePraktijkId = activePraktijkQuery.data?.activePraktijkId ?? ''
  const { membersQuery, invitesQuery, inviteMutation } = usePraktijkResources(activePraktijkId)

  const praktijken = praktijkenQuery.data ?? []
  const activePraktijk = useMemo(
    () => praktijken.find((praktijk) => praktijk.id === activePraktijkId),
    [praktijken, activePraktijkId]
  )

  const [selectedPraktijkId, setSelectedPraktijkId] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    phone: '',
  })
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user' as PraktijkMemberRole,
  })

  useEffect(() => {
    if (activePraktijkId) {
      setSelectedPraktijkId(activePraktijkId)
    }
  }, [activePraktijkId])

  const handleCreatePraktijk = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!userId || !createForm.name.trim()) return

    createPraktijkMutation.mutate({
      ...createForm,
      name: createForm.name.trim(),
      ownerId: userId,
      ownerEmail: user?.email ?? undefined,
      ownerName: user?.name ?? undefined,
    })

    setCreateForm({
      name: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      city: '',
      phone: '',
    })
  }

  const handleInviteMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activePraktijkId || !userId || !inviteForm.email.trim()) return

    inviteMutation.mutate({
      praktijkId: activePraktijkId,
      email: inviteForm.email.trim(),
      role: inviteForm.role,
      invitedBy: userId,
    })

    setInviteForm({ email: '', role: inviteForm.role })
  }

  const handlePraktijkChange = (praktijkId: string) => {
    setSelectedPraktijkId(praktijkId)
    if (praktijkId && userId) {
      setActivePraktijkMutation.mutate(praktijkId)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Praktijk</h1>
        <p className="text-sm text-muted-foreground">
          Beheer je praktijkgegevens, leden en uitnodigingen.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-muted bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Actieve praktijk</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Label htmlFor="praktijkSelect" className="text-sm font-medium">Selecteer praktijk</Label>
          <select
            id="praktijkSelect"
            className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedPraktijkId}
            onChange={(event) => handlePraktijkChange(event.target.value)}
          >
            <option value="">Geen actieve praktijk</option>
            {praktijken.map((praktijk) => (
              <option key={praktijk.id} value={praktijk.id}>
                {praktijk.name}
              </option>
            ))}
          </select>
        </div>
        {activePraktijk ? (
          <div className="grid gap-4 rounded-md border border-dashed border-muted p-4 text-sm">
            <div>
              <p className="font-semibold">{activePraktijk.name}</p>
              <p className="text-muted-foreground">Rol: {activePraktijk.role}</p>
            </div>
            <div>
              <p>{activePraktijk.addressLine1}</p>
              <p>{activePraktijk.addressLine2}</p>
              <p>
                {[activePraktijk.postalCode, activePraktijk.city].filter(Boolean).join(' ')}
              </p>
              <p>{activePraktijk.phone}</p>
            </div>
            <div>
              <Link className="text-sm font-medium text-primary underline" href="/praktijk/adressenboekje">
                Naar Adressenboekje
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nog geen actieve praktijk geselecteerd.</p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-muted bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Praktijk aanmaken</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreatePraktijk}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="praktijkName">Naam</Label>
            <Input
              id="praktijkName"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Naam van de praktijk"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="praktijkAddress">Adresregel 1</Label>
            <Input
              id="praktijkAddress"
              value={createForm.addressLine1}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
              placeholder="Straat en huisnummer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="praktijkAddress2">Adresregel 2</Label>
            <Input
              id="praktijkAddress2"
              value={createForm.addressLine2}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
              placeholder="Aanvulling"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="praktijkPostal">Postcode</Label>
            <Input
              id="praktijkPostal"
              value={createForm.postalCode}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, postalCode: event.target.value }))}
              placeholder="1234 AB"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="praktijkCity">Plaats</Label>
            <Input
              id="praktijkCity"
              value={createForm.city}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Plaats"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="praktijkPhone">Telefoon</Label>
            <Input
              id="praktijkPhone"
              value={createForm.phone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Telefoonnummer"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={createPraktijkMutation.isLoading}>
              Praktijk aanmaken
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-muted bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Leden</h2>
          {!activePraktijkId ? (
            <p className="text-sm text-muted-foreground">Selecteer eerst een praktijk.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {(membersQuery.data ?? []).map((member) => (
                <li key={member.id} className="flex flex-col gap-1 border-b border-dashed border-muted pb-3 last:border-none last:pb-0">
                  <span className="font-medium">{member.displayName ?? member.email ?? 'Onbekend'}</span>
                  <span className="text-muted-foreground">{member.email}</span>
                  <span className="text-muted-foreground">Rol: {member.role}</span>
                </li>
              ))}
              {(membersQuery.data ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">Nog geen leden gevonden.</li>
              )}
            </ul>
          )}
        </div>
        <div className="space-y-4 rounded-lg border border-muted bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Lid uitnodigen</h2>
          {!activePraktijkId ? (
            <p className="text-sm text-muted-foreground">Selecteer eerst een praktijk.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleInviteMember}>
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">E-mailadres</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="collega@praktijk.nl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Rol</Label>
                <select
                  id="inviteRole"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={inviteForm.role}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value as PraktijkMemberRole }))}
                >
                  <option value="user">Gebruiker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={inviteMutation.isLoading}>
                Verstuur uitnodiging
              </Button>
            </form>
          )}
          {activePraktijkId && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Openstaande uitnodigingen</h3>
              <ul className="space-y-2 text-sm">
                {(invitesQuery.data ?? []).map((invite) => (
                  <li key={invite.id} className="flex flex-col gap-1 border-b border-dashed border-muted pb-2 last:border-none last:pb-0">
                    <span className="font-medium">{invite.email}</span>
                    <span className="text-muted-foreground">Rol: {invite.role} • Status: {invite.status}</span>
                  </li>
                ))}
                {(invitesQuery.data ?? []).length === 0 && (
                  <li className="text-sm text-muted-foreground">Geen openstaande uitnodigingen.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default PraktijkPage
