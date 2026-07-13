import { Article } from './article'

export type PracticeMemberRole = 'admin' | 'user'

export type PracticeAddress = {
  addressLine1?: string
  postalCode?: string
  city?: string
  phone?: string
  email?: string
  notes?: string
}

export type Practice = {
  id: string
  name: string
  ownerId?: string
  address: PracticeAddress
  createdAt?: Date | string | null
}

export type ArticlePractice = {
  slug: string
} & Article

export type PracticeWithRole = Practice & {
  role: PracticeMemberRole
  version?: string
}

export type PracticeMember = {
  id: string
  practiceId: string
  userId: string
  role: PracticeMemberRole
  email?: string | null
  displayName?: string | null
  createdAt?: Date | string | null
}

export type PracticeInviteStatus = 'pending' | 'accepted' | 'declined'

export type PracticeInvite = {
  id: string
  practiceId: string
  email: string
  role: PracticeMemberRole
  invitedBy: string
  status: PracticeInviteStatus
  createdAt?: Date | string | null
}

export type UserState = {
  id: string
  activePraktijkId?: string | null
}
