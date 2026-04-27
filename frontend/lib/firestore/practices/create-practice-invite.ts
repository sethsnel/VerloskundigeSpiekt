import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

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
  const inviteRef = await addDoc(collection(firestoreDb, 'practices', input.practiceId, 'invites'), {
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
