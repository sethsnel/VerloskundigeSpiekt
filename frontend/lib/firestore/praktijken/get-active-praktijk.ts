import { doc, getDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { UserProfile } from '../../../schema/praktijk'

const getActivePraktijk = async (userId: string): Promise<UserProfile | null> => {
  const profileSnapshot = await getDoc(doc(firestoreDb, 'userProfiles', userId))
  if (!profileSnapshot.exists()) {
    return null
  }

  return {
    id: profileSnapshot.id,
    ...(profileSnapshot.data() as Omit<UserProfile, 'id'>),
  }
}

export default getActivePraktijk
