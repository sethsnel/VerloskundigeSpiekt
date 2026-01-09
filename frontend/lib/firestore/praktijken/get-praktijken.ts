import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PraktijkWithRole } from '../../../schema/praktijk'

const getPraktijkenForUser = async (userId: string): Promise<PraktijkWithRole[]> => {
  const membershipSnapshots = await getDocs(
    query(collection(firestoreDb, 'praktijkMembers'), where('userId', '==', userId))
  )

  const memberships = membershipSnapshots.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as { praktijkId: string; role: PraktijkWithRole['role'] }),
  }))

  const praktijken = await Promise.all(
    memberships.map(async (membership) => {
      const praktijkSnapshot = await getDoc(doc(firestoreDb, 'praktijken', membership.praktijkId))
      if (!praktijkSnapshot.exists()) {
        return null
      }

      const praktijkData = praktijkSnapshot.data() as Omit<PraktijkWithRole, 'id' | 'role'>
      return {
        id: praktijkSnapshot.id,
        role: membership.role,
        ...praktijkData,
      }
    })
  )

  return praktijken.filter((praktijk): praktijk is PraktijkWithRole => praktijk !== null)
}

export default getPraktijkenForUser
