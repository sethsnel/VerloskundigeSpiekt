import { collection, getDocs, query, where } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PraktijkAddress } from '../../../schema/praktijk'

const getPraktijkAddresses = async (praktijkId: string): Promise<PraktijkAddress[]> => {
  const addressSnapshots = await getDocs(
    query(collection(firestoreDb, 'praktijkAddresses'), where('praktijkId', '==', praktijkId))
  )

  return addressSnapshots.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Omit<PraktijkAddress, 'id'>),
  }))
}

export default getPraktijkAddresses
