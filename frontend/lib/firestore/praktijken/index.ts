import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import type {
  Praktijk,
  PraktijkAddress,
  PraktijkAddressBookEntry,
  PraktijkInvite,
  PraktijkMember,
  PraktijkRole,
} from '../../../schema/praktijk'

const PRAKTIJK_COLLECTION = 'praktijken'
const USER_SETTINGS_COLLECTION = 'userSettings'

export type PraktijkWithRole = Praktijk & { role: PraktijkRole }

export type PendingInvite = {
  id: string
  praktijkId: string
  praktijkName: string
  email: string
  role: PraktijkRole
  invitedBy: string
  createdAt?: string
}

export const createPraktijk = async ({
  name,
  address,
  userId,
  userEmail,
}: {
  name: string
  address: PraktijkAddress
  userId: string
  userEmail: string | null
}): Promise<Praktijk> => {
  const praktijkRef = await addDoc(collection(firestoreDb, PRAKTIJK_COLLECTION), {
    name,
    address,
    createdBy: userId,
    createdAt: serverTimestamp(),
  })

  await setDoc(
    doc(firestoreDb, PRAKTIJK_COLLECTION, praktijkRef.id, 'members', userId),
    {
      userId,
      email: userEmail,
      role: 'admin',
      createdAt: serverTimestamp(),
    },
  )

  await setDoc(
    doc(firestoreDb, USER_SETTINGS_COLLECTION, userId),
    { activePraktijkId: praktijkRef.id },
    { merge: true },
  )

  return {
    id: praktijkRef.id,
    name,
    address,
    createdBy: userId,
  }
}

export const getUserPraktijken = async (userId: string): Promise<PraktijkWithRole[]> => {
  const memberQuery = query(collectionGroup(firestoreDb, 'members'), where('userId', '==', userId))
  const memberSnapshot = await getDocs(memberQuery)

  const praktijken = await Promise.all(
    memberSnapshot.docs.map(async (memberDoc): Promise<PraktijkWithRole | null> => {
      const praktijkRef = memberDoc.ref.parent.parent
      if (!praktijkRef) return null

      const praktijkSnapshot = await getDoc(praktijkRef)
      if (!praktijkSnapshot.exists()) return null

      const praktijkData = praktijkSnapshot.data() as Omit<Praktijk, 'id'>
      const memberData = memberDoc.data() as Omit<PraktijkMember, 'id'>

      return {
        id: praktijkSnapshot.id,
        name: praktijkData.name,
        address: praktijkData.address,
        createdAt: praktijkData.createdAt,
        createdBy: praktijkData.createdBy,
        role: memberData.role ?? 'user',
      }
    }),
  )

  return praktijken.filter((praktijk): praktijk is PraktijkWithRole => praktijk !== null)
}

export const getPraktijk = async (praktijkId: string): Promise<Praktijk | null> => {
  const praktijkSnapshot = await getDoc(doc(firestoreDb, PRAKTIJK_COLLECTION, praktijkId))
  if (!praktijkSnapshot.exists()) return null

  const data = praktijkSnapshot.data() as Omit<Praktijk, 'id'>
  return {
    id: praktijkSnapshot.id,
    name: data.name,
    address: data.address,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
  }
}

export const getActivePraktijkId = async (userId: string): Promise<string | null> => {
  const settingsSnapshot = await getDoc(doc(firestoreDb, USER_SETTINGS_COLLECTION, userId))
  if (!settingsSnapshot.exists()) return null
  const data = settingsSnapshot.data() as { activePraktijkId?: string }
  return data.activePraktijkId ?? null
}

export const setActivePraktijk = async (userId: string, praktijkId: string) => {
  await setDoc(
    doc(firestoreDb, USER_SETTINGS_COLLECTION, userId),
    { activePraktijkId: praktijkId },
    { merge: true },
  )
}

export const getPraktijkMembers = async (praktijkId: string): Promise<PraktijkMember[]> => {
  const membersSnapshot = await getDocs(collection(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'members'))

  return membersSnapshot.docs.map((memberDoc) => {
    const data = memberDoc.data() as Omit<PraktijkMember, 'id'>
    return {
      id: memberDoc.id,
      userId: data.userId,
      email: data.email,
      role: data.role,
      createdAt: data.createdAt,
    }
  })
}

export const inviteMember = async ({
  praktijkId,
  email,
  role,
  invitedBy,
}: {
  praktijkId: string
  email: string
  role: PraktijkRole
  invitedBy: string
}): Promise<PraktijkInvite> => {
  const inviteRef = await addDoc(collection(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'invites'), {
    email,
    role,
    invitedBy,
    createdAt: serverTimestamp(),
  })

  return {
    id: inviteRef.id,
    email,
    role,
    invitedBy,
  }
}

export const getPraktijkInvites = async (praktijkId: string): Promise<PraktijkInvite[]> => {
  const invitesSnapshot = await getDocs(collection(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'invites'))

  return invitesSnapshot.docs.map((inviteDoc) => {
    const data = inviteDoc.data() as Omit<PraktijkInvite, 'id'>
    return {
      id: inviteDoc.id,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      createdAt: data.createdAt,
    }
  })
}

export const getPendingInvites = async (email: string): Promise<PendingInvite[]> => {
  const inviteQuery = query(collectionGroup(firestoreDb, 'invites'), where('email', '==', email))
  const inviteSnapshot = await getDocs(inviteQuery)

  const invites = await Promise.all(
    inviteSnapshot.docs.map(async (inviteDoc): Promise<PendingInvite | null> => {
      const praktijkRef = inviteDoc.ref.parent.parent
      if (!praktijkRef) return null

      const praktijkSnapshot = await getDoc(praktijkRef)
      if (!praktijkSnapshot.exists()) return null

      const praktijkData = praktijkSnapshot.data() as Omit<Praktijk, 'id'>
      const inviteData = inviteDoc.data() as Omit<PraktijkInvite, 'id'>

      return {
        id: inviteDoc.id,
        praktijkId: praktijkSnapshot.id,
        praktijkName: praktijkData.name,
        email: inviteData.email,
        role: inviteData.role,
        invitedBy: inviteData.invitedBy,
        createdAt: inviteData.createdAt,
      }
    }),
  )

  return invites.filter((invite): invite is PendingInvite => invite !== null)
}

export const acceptInvite = async ({
  praktijkId,
  inviteId,
  userId,
  userEmail,
  role,
}: {
  praktijkId: string
  inviteId: string
  userId: string
  userEmail: string | null
  role: PraktijkRole
}) => {
  await setDoc(
    doc(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'members', userId),
    {
      userId,
      email: userEmail,
      role,
      createdAt: serverTimestamp(),
    },
  )

  await deleteDoc(doc(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'invites', inviteId))

  await setDoc(
    doc(firestoreDb, USER_SETTINGS_COLLECTION, userId),
    { activePraktijkId: praktijkId },
    { merge: true },
  )
}

export const addAddressBookEntry = async ({
  praktijkId,
  entry,
}: {
  praktijkId: string
  entry: Omit<PraktijkAddressBookEntry, 'id' | 'createdAt'>
}) => {
  await addDoc(collection(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'adressenboekje'), {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

export const getAddressBookEntries = async (praktijkId: string): Promise<PraktijkAddressBookEntry[]> => {
  const entriesSnapshot = await getDocs(
    collection(firestoreDb, PRAKTIJK_COLLECTION, praktijkId, 'adressenboekje'),
  )

  return entriesSnapshot.docs.map((entryDoc) => {
    const data = entryDoc.data() as Omit<PraktijkAddressBookEntry, 'id'>
    return {
      id: entryDoc.id,
      name: data.name,
      addressLine: data.addressLine,
      postalCode: data.postalCode,
      city: data.city,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
    }
  })
}

export const updatePraktijkAddress = async ({
  praktijkId,
  address,
}: {
  praktijkId: string
  address: PraktijkAddress
}) => {
  await updateDoc(doc(firestoreDb, PRAKTIJK_COLLECTION, praktijkId), {
    address,
  })
}
