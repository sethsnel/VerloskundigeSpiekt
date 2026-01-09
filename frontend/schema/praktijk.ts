export type PraktijkRole = 'admin' | 'user'

export type PraktijkAddress = {
  street: string
  houseNumber: string
  postalCode: string
  city: string
}

export type Praktijk = {
  id: string
  name: string
  address: PraktijkAddress
  createdAt?: string
  createdBy: string
}

export type PraktijkMember = {
  id: string
  userId: string
  email: string | null
  role: PraktijkRole
  createdAt?: string
}

export type PraktijkInvite = {
  id: string
  email: string
  role: PraktijkRole
  invitedBy: string
  createdAt?: string
}

export type PraktijkAddressBookEntry = {
  id: string
  name: string
  addressLine: string
  postalCode: string
  city: string
  phone?: string
  email?: string
  notes?: string
  createdAt?: string
  createdBy: string
}
