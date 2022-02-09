import { doc, writeBatch } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

const setParentTopic = async (topicId: string, subtopicId: string, operation: 'assign' | 'remove' = 'assign'): Promise<void> => {
  try {
    const topicRef = doc(firestoreDb, `topics/${topicId}/children/${subtopicId}`)
    const subtopicRef = doc(firestoreDb, `sub-topics/${subtopicId}/parents/${topicId}`)

    const batch = writeBatch(firestoreDb)

    if (operation == 'assign') {
      batch.set(topicRef, {})
      batch.set(subtopicRef, {})
    }
    else {
      batch.delete(topicRef)
      batch.delete(subtopicRef)
    }

    await batch.commit()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }

}

export default setParentTopic