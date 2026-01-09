import { Timestamp } from 'firebase/firestore'

export type PraktijkMemberRole = 'admin' | 'user'

export type Praktijk = {
  id: string
  name: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  city?: string
  phone?: string
  ownerId?: string
  createdAt?: Timestamp | null
}

export type PraktijkWithRole = Praktijk & {
  role: PraktijkMemberRole
}

export type PraktijkMember = {
  id: string
  praktijkId: string
  userId: string
  role: PraktijkMemberRole
  email?: string | null
  displayName?: string | null
  createdAt?: Timestamp | null
}

export type PraktijkInviteStatus = 'pending' | 'accepted' | 'declined'

export type PraktijkInvite = {
  id: string
  praktijkId: string
  email: string
  role: PraktijkMemberRole
  invitedBy: string
  status: PraktijkInviteStatus
  createdAt?: Timestamp | null
}

export type PraktijkAddress = {
  id: string
  praktijkId: string
  name: string
  addressLine1?: string
  postalCode?: string
  city?: string
  phone?: string
  email?: string
  notes?: string
  createdAt?: Timestamp | null
}

export type UserProfile = {
  id: string
  activePraktijkId?: string | null
}
