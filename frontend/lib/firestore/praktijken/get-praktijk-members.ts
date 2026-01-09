import { collection, getDocs, query, where } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PraktijkMember } from '../../../schema/praktijk'

const getPraktijkMembers = async (praktijkId: string): Promise<PraktijkMember[]> => {
  const memberSnapshots = await getDocs(
    query(collection(firestoreDb, 'praktijkMembers'), where('praktijkId', '==', praktijkId))
  )

  return memberSnapshots.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Omit<PraktijkMember, 'id'>),
  }))
}

export default getPraktijkMembers
