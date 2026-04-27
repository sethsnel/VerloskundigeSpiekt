'use client'

import { Copy, X } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { PracticeHeader, PracticeLinks } from '../../components/practices'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useUser } from '../../lib/auth/use-user'
import { usePracticeInvites, usePracticeMembers, usePractices } from '../../lib/hooks/practices'
import { PracticeAddress, PracticeMemberRole } from '../../schema/practice'

const practiceInviteUrl = 'https://verloskundigespiekt.nl/praktijk'

const emptyAddress: PracticeAddress = {
  addressLine1: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
  notes: '',
}

const PraktijkPage = () => {
  const { user } = useUser()
  const { practicesQuery, activePracticeQuery, createPracticeMutation, updatePracticeMutation } = usePractices(user)
  const activePractice = activePracticeQuery.data
  const isAdmin = activePractice?.role === 'admin'
  const { membersQuery, invitesQuery, createInviteMutation, removeMemberMutation, transferOwnershipMutation, updateMemberRoleMutation } = usePracticeMembers(activePractice?.id, user?.id, isAdmin)
  const { pendingInvitesQuery, respondToInviteMutation } = usePracticeInvites(user)
  const [createName, setCreateName] = useState('')
  const [createAddress, setCreateAddress] = useState<PracticeAddress>(emptyAddress)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState<PracticeAddress>(emptyAddress)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<PracticeMemberRole>('user')
  const [showInviteToast, setShowInviteToast] = useState(false)

  useEffect(() => {
    if (activePractice) {
      setEditName(activePractice.name)
      setEditAddress({ ...emptyAddress, ...activePractice.address })
      setEditMode(false)
    }
  }, [activePractice])

  const isOwner = Boolean(user?.id && activePractice?.ownerId === user.id)
  const isLoading = practicesQuery.isLoading || activePracticeQuery.isLoading
  const pendingPracticeInvites = useMemo(
    () => (invitesQuery.data ?? []).filter((invite) => invite.status === 'pending'),
    [invitesQuery.data]
  )

  const onCreatePractice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = createName.trim()
    if (!name || !user) {
      return
    }

    createPracticeMutation.mutate({
      name,
      address: createAddress,
    }, {
      onSuccess: () => {
        setCreateName('')
        setCreateAddress(emptyAddress)
      },
    })
  }

  const onUpdatePractice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activePractice || !isAdmin) {
      return
    }

    updatePracticeMutation.mutate({
      practiceId: activePractice.id,
      name: editName.trim(),
      address: editAddress,
    }, {
      onSuccess: () => setEditMode(false),
    })
  }

  const onCreateInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inviteEmail.trim() || !isAdmin) {
      return
    }

    createInviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    }, {
      onSuccess: () => {
        setInviteEmail('')
        setInviteRole('user')
        setShowInviteToast(true)
      },
    })
  }

  const onCopyInviteUrl = async () => {
    await navigator.clipboard.writeText(practiceInviteUrl)
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-3xl font-semibold">Praktijk</h1>
        <p>Log in om een praktijk te registreren of een uitnodiging te bekijken.</p>
        <Button asChild>
          <Link href="/login">Aanmelden</Link>
        </Button>
      </main>
    )
  }

  if (isLoading) {
    return <main className="mx-auto max-w-5xl px-4 py-8">Praktijk laden...</main>
  }

  if (!activePractice) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h1 className="text-3xl font-semibold">Registreer praktijk</h1>
          <p>Registreer praktijk voor gedeelde functies op praktijk niveau.</p>
          <ul className="grid gap-3 text-left sm:grid-cols-2">
            <li className="rounded-md border p-4">Collega&apos;s beheren en toevoegen.</li>
            <li className="rounded-md border p-4">Gedeeld adressenboekje met zorgverleners.</li>
            <li className="rounded-md border p-4">Interne notities en beleid registreren.</li>
            <li className="rounded-md border p-4">Sjablonen voor patient en zorgverlener e-mail.</li>
          </ul>
        </section>
        <PendingInvites
          invites={pendingInvitesQuery.data ?? []}
          isSubmitting={respondToInviteMutation.isLoading}
          onRespond={(practiceId, inviteId, response) => respondToInviteMutation.mutate({ practiceId, inviteId, response })}
        />
        <PracticeCreateForm
          name={createName}
          address={createAddress}
          isSubmitting={createPracticeMutation.isLoading}
          onNameChange={setCreateName}
          onAddressChange={setCreateAddress}
          onSubmit={onCreatePractice}
        />
      </main>
    )
  }

  return (
    <main className="flex max-w-6xl flex-col gap-8 px-4 py-8">
      {showInviteToast && (
        <InviteToast
          url={practiceInviteUrl}
          onCopy={onCopyInviteUrl}
          onClose={() => setShowInviteToast(false)}
        />
      )}
      <header className="flex flex-col gap-3">
        <PracticeHeader practiceName={activePractice.name} />
        <PracticeLinks />
      </header>

      <PendingInvites
        invites={pendingInvitesQuery.data ?? []}
        isSubmitting={respondToInviteMutation.isLoading}
        onRespond={(practiceId, inviteId, response) => respondToInviteMutation.mutate({ practiceId, inviteId, response })}
      />

      <section className="flex flex-col gap-6">
        <section className="rounded-md border p-5">
          <h2 className="mb-4 text-xl font-semibold">Leden</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Naam</th>
                  <th scope="col" className="px-3 py-2 font-medium">E-mail</th>
                  <th scope="col" className="w-32 px-3 py-2 font-medium">Rol</th>
                  {isAdmin && <th scope="col" className="w-32 px-3 py-2 font-medium">Status</th>}
                  {isAdmin && <th scope="col" className="w-48 px-3 py-2 font-medium">Acties</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(membersQuery.data ?? []).map((member) => (
                  <tr key={member.id}>
                    <td className="max-w-48 truncate px-3 py-2 font-medium">
                      {member.displayName || member.email || member.userId}
                    </td>
                    <td className="text-muted-foreground max-w-56 truncate px-3 py-2">
                      {member.email || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {isAdmin && member.userId !== activePractice.ownerId ? (
                        <Select
                          value={member.role}
                          onValueChange={(role) => updateMemberRoleMutation.mutate({ userId: member.userId, role: role as PracticeMemberRole })}
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="user">user</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex rounded-md border px-2 py-1 text-sm">{member.role}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <span className="text-muted-foreground text-sm">Actief</span>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-3 py-2">
                        {member.userId !== activePractice.ownerId ? (
                          <div className="flex flex-wrap gap-2">
                            {isOwner && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={transferOwnershipMutation.isLoading}
                                onClick={() => {
                                  const label = member.displayName || member.email || member.userId
                                  if (window.confirm(`Weet je zeker dat je ${label} eigenaar van deze praktijk wilt maken?`)) {
                                    transferOwnershipMutation.mutate({ newOwnerId: member.userId })
                                  }
                                }}
                              >
                                Maak eigenaar
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={removeMemberMutation.isLoading}
                              onClick={() => {
                                const label = member.displayName || member.email || member.userId
                                if (window.confirm(`Weet je zeker dat je ${label} uit deze praktijk wilt verwijderen?`)) {
                                  removeMemberMutation.mutate({ userId: member.userId })
                                }
                              }}
                            >
                              Verwijderen
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Eigenaar</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {pendingPracticeInvites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="max-w-48 truncate px-3 py-2 font-medium">
                      {invite.email}
                    </td>
                    <td className="text-muted-foreground max-w-56 truncate px-3 py-2">
                      {invite.email}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-md border px-2 py-1 text-sm">{invite.role}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <span className="text-muted-foreground text-sm">Wachten op accepteren</span>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <span className="text-muted-foreground text-sm">-</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isAdmin && (
          <section className="max-w-md rounded-md border p-5">
            <h2 className="mb-4 text-xl font-semibold">Uitnodigen</h2>
            <form className="flex flex-col gap-3" onSubmit={onCreateInvite}>
              <div className="grid gap-2">
                <Label htmlFor="invite-email">E-mailadres</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Select value={inviteRole} onValueChange={(role) => setInviteRole(role as PracticeMemberRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createInviteMutation.isLoading}>
                Collega aanmelden
              </Button>
            </form>
          </section>
        )}

        <section className="rounded-md border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Praktijkgegevens</h2>
            {isAdmin && !editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Bewerken
              </Button>
            )}
          </div>
          {editMode ? (
            <PracticeDetailsForm
              name={editName}
              address={editAddress}
              isSubmitting={updatePracticeMutation.isLoading}
              onNameChange={setEditName}
              onAddressChange={setEditAddress}
              onCancel={() => {
                setEditName(activePractice.name)
                setEditAddress({ ...emptyAddress, ...activePractice.address })
                setEditMode(false)
              }}
              onSubmit={onUpdatePractice}
            />
          ) : (
            <PracticeDetails name={activePractice.name} address={activePractice.address} />
          )}
        </section>
      </section>
    </main>
  )
}

type AddressFormProps = {
  address: PracticeAddress
  onAddressChange: (address: PracticeAddress) => void
}

const AddressFields = ({ address, onAddressChange }: AddressFormProps) => {
  const updateAddress = (field: keyof PracticeAddress, value: string) => {
    onAddressChange({ ...address, [field]: value })
  }

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="addressLine1">Adres</Label>
        <Input id="addressLine1" value={address.addressLine1 ?? ''} onChange={(event) => updateAddress('addressLine1', event.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="postalCode">Postcode</Label>
          <Input id="postalCode" value={address.postalCode ?? ''} onChange={(event) => updateAddress('postalCode', event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">Plaats</Label>
          <Input id="city" value={address.city ?? ''} onChange={(event) => updateAddress('city', event.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefoon</Label>
          <Input id="phone" value={address.phone ?? ''} onChange={(event) => updateAddress('phone', event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={address.email ?? ''} onChange={(event) => updateAddress('email', event.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notities</Label>
        <textarea
          id="notes"
          className="border-input min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
          value={address.notes ?? ''}
          onChange={(event) => updateAddress('notes', event.target.value)}
        />
      </div>
    </>
  )
}

type PracticeFormProps = AddressFormProps & {
  name: string
  isSubmitting: boolean
  onNameChange: (name: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const PracticeCreateForm = ({ name, address, isSubmitting, onNameChange, onAddressChange, onSubmit }: PracticeFormProps) => (
  <form className="mx-auto grid w-full max-w-2xl gap-4 rounded-md border p-5" onSubmit={onSubmit}>
    <h2 className="text-xl font-semibold">Nieuwe praktijk</h2>
    <div className="grid gap-2">
      <Label htmlFor="practiceName">Naam</Label>
      <Input id="practiceName" value={name} onChange={(event) => onNameChange(event.target.value)} required />
    </div>
    <AddressFields address={address} onAddressChange={onAddressChange} />
    <Button type="submit" disabled={isSubmitting}>
      Registreer praktijk
    </Button>
  </form>
)

const PracticeDetailsForm = ({ name, address, isSubmitting, onNameChange, onAddressChange, onSubmit, onCancel }: PracticeFormProps & { onCancel: () => void }) => (
  <form className="grid gap-4" onSubmit={onSubmit}>
    <div className="grid gap-2">
      <Label htmlFor="editPracticeName">Naam</Label>
      <Input id="editPracticeName" value={name} onChange={(event) => onNameChange(event.target.value)} required />
    </div>
    <AddressFields address={address} onAddressChange={onAddressChange} />
    <div className="flex gap-2">
      <Button type="submit" disabled={isSubmitting}>Opslaan</Button>
      <Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button>
    </div>
  </form>
)

const PracticeDetails = ({ name, address }: { name: string, address: PracticeAddress }) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    <div>
      <dt className="text-muted-foreground text-sm">Naam</dt>
      <dd className="font-medium">{name}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground text-sm">Adres</dt>
      <dd>{address.addressLine1 || '-'}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground text-sm">Postcode</dt>
      <dd>{address.postalCode || '-'}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground text-sm">Plaats</dt>
      <dd>{address.city || '-'}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground text-sm">Telefoon</dt>
      <dd>{address.phone || '-'}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground text-sm">E-mail</dt>
      <dd>{address.email || '-'}</dd>
    </div>
    <div className="sm:col-span-2">
      <dt className="text-muted-foreground text-sm">Notities</dt>
      <dd>{address.notes || '-'}</dd>
    </div>
  </dl>
)

const InviteToast = ({
  url,
  onCopy,
  onClose,
}: {
  url: string
  onCopy: () => void | Promise<void>
  onClose: () => void
}) => (
  <div className="fixed right-4 top-4 z-50 flex max-w-lg items-start gap-3 rounded-md border bg-background p-4 text-sm shadow-lg">
    <p className="flex-1 leading-5">
      Stuur{' '}
      <a className="text-link underline underline-offset-2" href={url} target="_blank">
        {url}
      </a>
      {' '}naar collega zodat deze de uitnodiging kan accepteren.
    </p>
    <Button type="button" size="sm" variant="outline" onClick={onCopy} aria-label="Kopieer praktijk url">
      <Copy className="h-4 w-4" />
      Kopieer
    </Button>
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground"
      onClick={onClose}
      aria-label="Sluit melding"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
)

const PendingInvites = ({
  invites,
  isSubmitting,
  onRespond,
}: {
  invites: { id: string, practiceId: string, email: string, role: PracticeMemberRole, practiceName?: string }[]
  isSubmitting: boolean
  onRespond: (practiceId: string, inviteId: string, response: 'accepted' | 'declined') => void
}) => {
  if (invites.length === 0) {
    return undefined
  }

  return (
    <section className="rounded-md border p-5">
      <h2 className="mb-4 text-xl font-semibold">Uitnodigingen</h2>
      <div className="grid gap-3">
        {invites.map((invite) => (
          <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3">
            <p>Je bent uitgenodigd voor {invite.practiceName || 'praktijk'}.</p>
            <div className="flex gap-2">
              <Button size="sm" disabled={isSubmitting} onClick={() => onRespond(invite.practiceId, invite.id, 'accepted')}>
                Accepteren
              </Button>
              <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => onRespond(invite.practiceId, invite.id, 'declined')}>
                Weigeren
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PraktijkPage
