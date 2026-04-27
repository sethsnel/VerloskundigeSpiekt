import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeInvite, PracticeMemberRole } from '../../../schema/practice'

export type CreatePracticeInviteInput = {
  practiceId: string
  email: string
  role: PracticeMemberRole
  invitedBy: string
}

const createPracticeInvite = async (input: CreatePracticeInviteInput): Promise<PracticeInvite> => {
  const email = input.email.trim().toLowerCase()
  const invitesRef = collection(firestoreDb, 'practices', input.practiceId, 'invites')
  const existingInvitesSnapshot = await getDocs(query(
    invitesRef,
    where('email', '==', email),
    where('status', '==', 'pending'),
    limit(1)
  ))

  if (!existingInvitesSnapshot.empty) {
    const existingInvite = existingInvitesSnapshot.docs[0]
    const data = existingInvite.data()

    return {
      id: existingInvite.id,
      practiceId: input.practiceId,
      email: data.email ?? email,
      role: data.role ?? 'user',
      invitedBy: data.invitedBy ?? input.invitedBy,
      status: 'pending',
      createdAt: data.createdAt ?? null,
    }
  }

  const inviteRef = await addDoc(invitesRef, {
    email,
    role: input.role,
    invitedBy: input.invitedBy,
    status: 'pending',
    createdAt: serverTimestamp(),
  })

  return {
    id: inviteRef.id,
    practiceId: input.practiceId,
    email,
    role: input.role,
    invitedBy: input.invitedBy,
    status: 'pending',
    createdAt: null,
  }
}

export default createPracticeInvite
