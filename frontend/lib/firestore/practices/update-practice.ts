import { doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeAddress } from '../../../schema/practice'

export type UpdatePracticeInput = {
  practiceId: string
  name: string
  address: PracticeAddress
}

const updatePractice = async (input: UpdatePracticeInput): Promise<UpdatePracticeInput> => {
  await updateDoc(doc(firestoreDb, 'practices', input.practiceId), {
    name: input.name,
    address: input.address,
  })

  return input
}

export default updatePractice
