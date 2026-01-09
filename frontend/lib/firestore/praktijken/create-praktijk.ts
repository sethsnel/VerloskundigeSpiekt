import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Praktijk, PraktijkMemberRole } from '../../../schema/praktijk'

export type CreatePraktijkInput = {
  name: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  city?: string
  phone?: string
  ownerId: string
  ownerEmail?: string | null
  ownerName?: string | null
}

const createPraktijk = async (input: CreatePraktijkInput): Promise<Praktijk> => {
  const praktijkRef = await addDoc(collection(firestoreDb, 'praktijken'), {
    name: input.name,
    addressLine1: input.addressLine1 ?? '',
    addressLine2: input.addressLine2 ?? '',
    postalCode: input.postalCode ?? '',
    city: input.city ?? '',
    phone: input.phone ?? '',
    ownerId: input.ownerId,
    createdAt: serverTimestamp(),
  })

  const memberId = `${praktijkRef.id}_${input.ownerId}`
  await setDoc(doc(firestoreDb, 'praktijkMembers', memberId), {
    praktijkId: praktijkRef.id,
    userId: input.ownerId,
    role: 'admin' as PraktijkMemberRole,
    email: input.ownerEmail ?? null,
    displayName: input.ownerName ?? null,
    createdAt: serverTimestamp(),
  })

  await setDoc(
    doc(firestoreDb, 'userProfiles', input.ownerId),
    { activePraktijkId: praktijkRef.id },
    { merge: true }
  )

  return {
    id: praktijkRef.id,
    name: input.name,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    postalCode: input.postalCode,
    city: input.city,
    phone: input.phone,
    ownerId: input.ownerId,
    createdAt: null,
  }
}

export default createPraktijk
