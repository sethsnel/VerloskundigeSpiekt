import { doc, getDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeWithRole } from '../../../schema/practice'
import getPracticesForUser from './get-practices-for-user'

const getActivePractice = async (userId: string): Promise<PracticeWithRole | undefined> => {
  const userStateDoc = await getDoc(doc(firestoreDb, 'userState', userId))
  const activePraktijkId = userStateDoc.data()?.activePraktijkId

  if (!activePraktijkId) {
    return undefined
  }

  const practices = await getPracticesForUser(userId)
  return practices.find((practice) => practice.id === activePraktijkId)
}

export default getActivePractice
