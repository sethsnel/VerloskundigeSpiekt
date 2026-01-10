'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/auth/use-user'
import {
  useAcceptInvite,
  useActivePraktijk,
  useCreatePraktijk,
  useInviteMember,
  usePendingInvites,
  usePraktijken,
  usePraktijkInvites,
  usePraktijkMembers,
  useSetActivePraktijk,
  useUpdatePraktijkAddress,
} from '@/lib/hooks/praktijken/usePraktijken'
import type { PraktijkAddress, PraktijkRole } from '../../schema/praktijk'

const emptyAddress: PraktijkAddress = {
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
}

export default function PraktijkPage() {
  const { user } = useUser()
  const praktijkenQuery = usePraktijken(user?.id)
  const activePraktijkQuery = useActivePraktijk(user?.id)
  const setActivePraktijkMutation = useSetActivePraktijk()
  const createPraktijkMutation = useCreatePraktijk()
  const acceptInviteMutation = useAcceptInvite(user?.id)

  const praktijken = praktijkenQuery.data ?? []
  const activePraktijkId = activePraktijkQuery.data ?? null
  const activePraktijk = useMemo(
    () => praktijken.find((praktijk) => praktijk.id === activePraktijkId) ?? null,
    [praktijken, activePraktijkId],
  )
  const activeRole = activePraktijk?.role ?? 'user'

  const membersQuery = usePraktijkMembers(activePraktijk?.id)
  const invitesQuery = usePraktijkInvites(activePraktijk?.id)
  const pendingInvitesQuery = usePendingInvites(user?.email)
  const inviteMemberMutation = useInviteMember(activePraktijk?.id)
  const updateAddressMutation = useUpdatePraktijkAddress(activePraktijk?.id, user?.id)

  const [praktijkName, setPraktijkName] = useState('')
  const [praktijkAddress, setPraktijkAddress] = useState<PraktijkAddress>(emptyAddress)
  const [addressForm, setAddressForm] = useState<PraktijkAddress>(emptyAddress)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<PraktijkRole>('user')

  useEffect(() => {
    setAddressForm(activePraktijk?.address ?? emptyAddress)
  }, [activePraktijk])

  if (!user) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">Praktijk</h1>
        <p>Je moet ingelogd zijn om praktijken te beheren.</p>
        <Button asChild>
          <Link href="/login">Inloggen</Link>
        </Button>
      </div>
    )
  }

  const handleCreatePraktijk = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!praktijkName.trim()) return

    await createPraktijkMutation.mutateAsync({
      name: praktijkName.trim(),
      address: praktijkAddress,
      userId: user.id,
      userEmail: user.email,
    })

    setPraktijkName('')
    setPraktijkAddress(emptyAddress)
  }

  const handleSwitchPraktijk = async (praktijkId: string) => {
    await setActivePraktijkMutation.mutateAsync({
      userId: user.id,
      praktijkId,
    })
  }

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!inviteEmail.trim() || !activePraktijk) return

    await inviteMemberMutation.mutateAsync({
      email: inviteEmail.trim(),
      role: inviteRole,
      invitedBy: user.id,
    })

    setInviteEmail('')
    setInviteRole('user')
  }

  const handleAcceptInvite = async (invite: {
    praktijkId: string
    id: string
    role: PraktijkRole
  }) => {
    await acceptInviteMutation.mutateAsync({
      praktijkId: invite.praktijkId,
      inviteId: invite.id,
      userEmail: user.email,
      role: invite.role,
    })
  }

  const handleUpdateAddress = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!activePraktijk) return

    await updateAddressMutation.mutateAsync(addressForm)
  }

  return (
    <div className="max-w-5xl space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Praktijk</h1>
        <p className="text-muted-foreground">
          Beheer je praktijken, leden en uitnodigingen. Deel adressen in het gezamenlijke adressenboekje.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Actieve praktijk</h2>
          <Button asChild variant="outline">
            <Link href="/praktijk/adressenboekje">Naar adressenboekje</Link>
          </Button>
        </div>

        {praktijken.length === 0 ? (
          <p className="text-muted-foreground">Je bent nog niet gekoppeld aan een praktijk.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <Label htmlFor="praktijk-switch">Kies een praktijk</Label>
            <select
              id="praktijk-switch"
              className="h-10 rounded-md border border-input bg-background px-3"
              value={activePraktijkId ?? ''}
              onChange={(event) => handleSwitchPraktijk(event.target.value)}
            >
              <option value="" disabled>
                Kies een praktijk
              </option>
              {praktijken.map((praktijk) => (
                <option key={praktijk.id} value={praktijk.id}>
                  {praktijk.name} ({praktijk.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {activePraktijk && (
          <div className="grid gap-4 rounded-md border border-dashed border-border bg-muted/10 p-4">
            <div>
              <h3 className="text-lg font-semibold">{activePraktijk.name}</h3>
              <p className="text-sm text-muted-foreground">Rol: {activeRole}</p>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Adres</p>
              <p className="text-sm text-muted-foreground">
                {activePraktijk.address.street} {activePraktijk.address.houseNumber},{' '}
                {activePraktijk.address.postalCode} {activePraktijk.address.city}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Nieuwe praktijk aanmaken</h2>
        <form className="grid gap-4" onSubmit={handleCreatePraktijk}>
          <div className="grid gap-2">
            <Label htmlFor="praktijk-name">Naam</Label>
            <Input
              id="praktijk-name"
              value={praktijkName}
              onChange={(event) => setPraktijkName(event.target.value)}
              placeholder="Praktijknaam"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="praktijk-street">Straat</Label>
            <Input
              id="praktijk-street"
              value={praktijkAddress.street}
              onChange={(event) => setPraktijkAddress({ ...praktijkAddress, street: event.target.value })}
              placeholder="Straatnaam"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="praktijk-house-number">Huisnummer</Label>
              <Input
                id="praktijk-house-number"
                value={praktijkAddress.houseNumber}
                onChange={(event) => setPraktijkAddress({ ...praktijkAddress, houseNumber: event.target.value })}
                placeholder="10A"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="praktijk-postal">Postcode</Label>
              <Input
                id="praktijk-postal"
                value={praktijkAddress.postalCode}
                onChange={(event) => setPraktijkAddress({ ...praktijkAddress, postalCode: event.target.value })}
                placeholder="1234 AB"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="praktijk-city">Plaats</Label>
              <Input
                id="praktijk-city"
                value={praktijkAddress.city}
                onChange={(event) => setPraktijkAddress({ ...praktijkAddress, city: event.target.value })}
                placeholder="Utrecht"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={createPraktijkMutation.isLoading}>
            Praktijk aanmaken
          </Button>
        </form>
      </section>

      {activePraktijk && (
        <section className="grid gap-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Praktijkgegevens</h2>
            <span className="text-sm text-muted-foreground">Alleen admins kunnen aanpassen</span>
          </div>
          <form className="grid gap-4" onSubmit={handleUpdateAddress}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="address-street">Straat</Label>
                <Input
                  id="address-street"
                  value={addressForm.street}
                  onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })}
                  required
                  disabled={activeRole !== 'admin'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address-house">Huisnummer</Label>
                <Input
                  id="address-house"
                  value={addressForm.houseNumber}
                  onChange={(event) => setAddressForm({ ...addressForm, houseNumber: event.target.value })}
                  required
                  disabled={activeRole !== 'admin'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address-postal">Postcode</Label>
                <Input
                  id="address-postal"
                  value={addressForm.postalCode}
                  onChange={(event) => setAddressForm({ ...addressForm, postalCode: event.target.value })}
                  required
                  disabled={activeRole !== 'admin'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address-city">Plaats</Label>
                <Input
                  id="address-city"
                  value={addressForm.city}
                  onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })}
                  required
                  disabled={activeRole !== 'admin'}
                />
              </div>
            </div>
            <Button type="submit" disabled={activeRole !== 'admin' || updateAddressMutation.isLoading}>
              Adres bijwerken
            </Button>
          </form>
        </section>
      )}

      {activePraktijk && (
        <section className="grid gap-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Leden</h2>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <h3 className="text-base font-semibold">Ledenlijst</h3>
              <div className="grid gap-2">
                {(membersQuery.data ?? []).map((member) => (
                  <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/10 p-3">
                    <div>
                      <p className="font-medium">{member.email ?? member.userId}</p>
                      <p className="text-sm text-muted-foreground">Rol: {member.role}</p>
                    </div>
                  </div>
                ))}
                {(membersQuery.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nog geen leden gevonden.</p>
                )}
              </div>
            </div>

            {activeRole === 'admin' && (
              <div className="grid gap-3 rounded-md border border-dashed border-border p-4">
                <h3 className="text-base font-semibold">Nieuwe leden uitnodigen</h3>
                <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={handleInvite}>
                  <Input
                    type="email"
                    placeholder="naam@praktijk.nl"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    required
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as PraktijkRole)}
                  >
                    <option value="user">Gebruiker</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button type="submit" disabled={inviteMemberMutation.isLoading}>
                    Uitnodigen
                  </Button>
                </form>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  {(invitesQuery.data ?? []).map((invite) => (
                    <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>{invite.email}</span>
                      <span className="text-xs uppercase">{invite.role}</span>
                    </div>
                  ))}
                  {(invitesQuery.data ?? []).length === 0 && <span>Geen openstaande uitnodigingen.</span>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-4 rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Jouw uitnodigingen</h2>
        {(pendingInvitesQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Je hebt geen openstaande uitnodigingen.</p>
        ) : (
          <div className="grid gap-3">
            {(pendingInvitesQuery.data ?? []).map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/10 p-3">
                <div>
                  <p className="font-medium">{invite.praktijkName}</p>
                  <p className="text-sm text-muted-foreground">Rol: {invite.role}</p>
                </div>
                <Button
                  onClick={() => handleAcceptInvite(invite)}
                  disabled={acceptInviteMutation.isLoading}
                >
                  Accepteer
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
