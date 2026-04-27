import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Practice, PracticeAddress } from '../../../schema/practice'

export type CreatePracticeInput = {
  name: string
  ownerId: string
  ownerEmail?: string | null
  ownerName?: string | null
  address?: PracticeAddress
}

const createPractice = async (input: CreatePracticeInput): Promise<Practice> => {
  const address = input.address ?? {}
  const practiceRef = await addDoc(collection(firestoreDb, 'practices'), {
    name: input.name,
    ownerId: input.ownerId,
    address,
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(firestoreDb, 'practices', practiceRef.id, 'members', input.ownerId), {
    practiceId: practiceRef.id,
    userId: input.ownerId,
    role: 'admin',
    email: input.ownerEmail ?? null,
    displayName: input.ownerName ?? null,
    createdAt: serverTimestamp(),
  })

  await setDoc(
    doc(firestoreDb, 'userState', input.ownerId),
    { activePraktijkId: practiceRef.id },
    { merge: true }
  )

  return {
    id: practiceRef.id,
    name: input.name,
    ownerId: input.ownerId,
    address,
    createdAt: null,
  }
}

export default createPractice
