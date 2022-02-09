import { collection, getDocs, query } from 'firebase/firestore'

import Topic from '../../../schema/topic'
import { firestoreDb } from '../../../config/firebaseConfig'

const queryAllTopics = query(collection(firestoreDb, "topics"))

const getTopics = async (): Promise<Topic[]> => {
  try {
    const querySnapshot = await getDocs(queryAllTopics)
    const topics: Topic[] = []

    querySnapshot.forEach((doc) => {
      topics.push({
        id: doc.id,
        ...doc.data()
      } as Topic)
    })

    return topics
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }

  return []
}

export default getTopics