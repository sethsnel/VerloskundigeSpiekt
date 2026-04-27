import { deleteDoc, doc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

export type RemovePracticeMemberInput = {
  practiceId: string
  userId: string
}

const removePracticeMember = async (input: RemovePracticeMemberInput): Promise<RemovePracticeMemberInput> => {
  await deleteDoc(doc(firestoreDb, 'practices', input.practiceId, 'members', input.userId))

  return input
}

export default removePracticeMember
