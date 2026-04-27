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

const getPracticeInvites = async (practiceId: string): Promise<PracticeInvite[]> => {
  const invitesSnapshot = await getDocs(collection(firestoreDb, 'practices', practiceId, 'invites'))
  return invitesSnapshot.docs.map((inviteDoc) => mapPracticeInviteDoc(inviteDoc.id, practiceId, inviteDoc.data()))
}

export default getPracticeInvites
