import { collection, getDocs, query, where } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PraktijkInvite } from '../../../schema/praktijk'

const getPraktijkInvites = async (praktijkId: string): Promise<PraktijkInvite[]> => {
  const inviteSnapshots = await getDocs(
    query(collection(firestoreDb, 'praktijkInvites'), where('praktijkId', '==', praktijkId))
  )

  return inviteSnapshots.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Omit<PraktijkInvite, 'id'>),
  }))
}

export default getPraktijkInvites
