import { collection, doc, getDoc } from 'firebase/firestore'

import Topic from '../../../schema/topic'
import { firestoreDb } from '../../../config/firebaseConfig'

const getTopic = async (topicId: string): Promise<Topic | undefined> => {
  try {
    const topicsRef = collection(firestoreDb, "topics")
    const topicDoc = await getDoc(doc(topicsRef, topicId))

    return {
      id: topicDoc.id,
      ...topicDoc.data()
    } as Topic
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }

  return undefined
}

export default getTopic