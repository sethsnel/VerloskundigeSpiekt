import { doc, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

const setActivePractice = async (userId: string, practiceId: string | null): Promise<string | null> => {
  await setDoc(
    doc(firestoreDb, 'userState', userId),
    { activePraktijkId: practiceId },
    { merge: true }
  )

  return practiceId
}

export default setActivePractice
