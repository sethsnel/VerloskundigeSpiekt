import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

export type RespondToPracticeInviteInput = {
  practiceId: string
  inviteId: string
  userId: string
  email?: string | null
  displayName?: string | null
  response: 'accepted' | 'declined'
}

const respondToPracticeInvite = async (input: RespondToPracticeInviteInput): Promise<RespondToPracticeInviteInput> => {
  const inviteRef = doc(firestoreDb, 'practices', input.practiceId, 'invites', input.inviteId)

  if (input.response === 'accepted') {
    const inviteDoc = await getDoc(inviteRef)
    const inviteRole = inviteDoc.data()?.role ?? 'user'

    await setDoc(doc(firestoreDb, 'practices', input.practiceId, 'members', input.userId), {
      practiceId: input.practiceId,
      userId: input.userId,
      role: inviteRole,
      email: input.email ?? null,
      displayName: input.displayName ?? null,
      createdAt: serverTimestamp(),
    })
    await setDoc(
      doc(firestoreDb, 'userState', input.userId),
      { activePraktijkId: input.practiceId },
      { merge: true }
    )
  }

  await updateDoc(inviteRef, {
    status: input.response,
  })

  return input
}

export default respondToPracticeInvite
