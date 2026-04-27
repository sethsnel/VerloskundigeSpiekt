import { doc, runTransaction } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

export type TransferPracticeOwnershipInput = {
  practiceId: string
  newOwnerId: string
}

const transferPracticeOwnership = async (input: TransferPracticeOwnershipInput): Promise<TransferPracticeOwnershipInput> => {
  const practiceRef = doc(firestoreDb, 'practices', input.practiceId)
  const newOwnerMemberRef = doc(firestoreDb, 'practices', input.practiceId, 'members', input.newOwnerId)

  await runTransaction(firestoreDb, async (transaction) => {
    const newOwnerMemberDoc = await transaction.get(newOwnerMemberRef)

    if (!newOwnerMemberDoc.exists()) {
      throw new Error('Nieuwe eigenaar is geen lid van deze praktijk')
    }

    transaction.update(practiceRef, {
      ownerId: input.newOwnerId,
    })

    transaction.update(newOwnerMemberRef, {
      role: 'admin',
    })
  })

  return input
}

export default transferPracticeOwnership
