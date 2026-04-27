import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeInvite } from '../../../schema/practice'

const mapPracticeInviteDoc = (id: string, practiceId: string, data: Record<string, any>): PracticeInvite => ({
  id,
  practiceId,
  email: data.email ?? '',
  role: data.role ?? 'user',
  invitedBy: data.invitedBy ?? '',
  status: data.status ?? 'pending',
  createdAt: data.createdAt ?? null,
})

const getPendingPracticeInvites = async (email: string): Promise<PracticeInvite[]> => {
  const normalizedEmail = email.trim().toLowerCase()
  const practicesSnapshot = await getDocs(collection(firestoreDb, 'practices'))
  const invites = await Promise.all(
    practicesSnapshot.docs.map(async (practiceDoc) => {
      const invitesSnapshot = await getDocs(collection(firestoreDb, 'practices', practiceDoc.id, 'invites'))
      return invitesSnapshot.docs
        .map((inviteDoc) => mapPracticeInviteDoc(inviteDoc.id, practiceDoc.id, inviteDoc.data()))
        .filter((invite) => invite.email.toLowerCase() === normalizedEmail && invite.status === 'pending')
    })
  )

  return invites.flat()
}

export default getPendingPracticeInvites
