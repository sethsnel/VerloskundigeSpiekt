import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeInvite } from '../../../schema/practice'

export type PendingPracticeInvite = PracticeInvite & {
  practiceName?: string
}

const mapPracticeInviteDoc = (id: string, practiceId: string, data: Record<string, any>, practiceName?: string): PendingPracticeInvite => ({
  id,
  practiceId,
  practiceName,
  email: data.email ?? '',
  role: data.role ?? 'user',
  invitedBy: data.invitedBy ?? '',
  status: data.status ?? 'pending',
  createdAt: data.createdAt ?? null,
})

const getPendingPracticeInvites = async (email: string): Promise<PendingPracticeInvite[]> => {
  const normalizedEmail = email.trim().toLowerCase()
  const practicesSnapshot = await getDocs(collection(firestoreDb, 'practices'))
  const invites = await Promise.all(
    practicesSnapshot.docs.map(async (practiceDoc) => {
      const practiceName = practiceDoc.data().name
      const invitesSnapshot = await getDocs(collection(firestoreDb, 'practices', practiceDoc.id, 'invites'))
      return invitesSnapshot.docs
        .map((inviteDoc) => mapPracticeInviteDoc(inviteDoc.id, practiceDoc.id, inviteDoc.data(), practiceName))
        .filter((invite) => invite.email.toLowerCase() === normalizedEmail && invite.status === 'pending')
    })
  )

  return invites.flat()
}

export default getPendingPracticeInvites
