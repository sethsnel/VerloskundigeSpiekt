import { doc, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

const setActivePraktijk = async (userId: string, praktijkId: string): Promise<void> => {
  await setDoc(doc(firestoreDb, 'userProfiles', userId), { activePraktijkId: praktijkId }, { merge: true })
}

export default setActivePraktijk
