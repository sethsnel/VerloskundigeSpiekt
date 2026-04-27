import { doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeMemberRole } from '../../../schema/practice'

export type UpdatePracticeMemberRoleInput = {
  practiceId: string
  userId: string
  role: PracticeMemberRole
}

const updatePracticeMemberRole = async (input: UpdatePracticeMemberRoleInput): Promise<UpdatePracticeMemberRoleInput> => {
  await updateDoc(doc(firestoreDb, 'practices', input.practiceId, 'members', input.userId), {
    role: input.role,
  })

  return input
}

export default updatePracticeMemberRole
