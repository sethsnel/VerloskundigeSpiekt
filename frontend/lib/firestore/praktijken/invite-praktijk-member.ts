import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PraktijkInvite, PraktijkMemberRole } from '../../../schema/praktijk'

export type InvitePraktijkMemberInput = {
  praktijkId: string
  email: string
  role: PraktijkMemberRole
  invitedBy: string
}

const invitePraktijkMember = async (input: InvitePraktijkMemberInput): Promise<PraktijkInvite> => {
  const inviteRef = await addDoc(collection(firestoreDb, 'praktijkInvites'), {
    praktijkId: input.praktijkId,
    email: input.email,
    role: input.role,
    invitedBy: input.invitedBy,
    status: 'pending',
    createdAt: serverTimestamp(),
  })

  return {
    id: inviteRef.id,
    praktijkId: input.praktijkId,
    email: input.email,
    role: input.role,
    invitedBy: input.invitedBy,
    status: 'pending',
    createdAt: null,
  }
}

export default invitePraktijkMember
