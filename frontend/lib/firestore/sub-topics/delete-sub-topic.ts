import { collection, doc, getDocs, deleteDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import SubTopic from '../../../schema/sub-topic'
import { setParentTopic } from '../topics'

const deleteSubTopic = async (subtopic: SubTopic): Promise<void> => {
  try {
    const subtopicsCollectionRef = collection(firestoreDb, 'sub-topics')
    const parents = await getDocs(collection(subtopicsCollectionRef, `${subtopic.id}/parents`))

    parents.forEach(async (parentTopic) => {
      setParentTopic(parentTopic.id, subtopic.id || '', 'remove')
    })

    await deleteDoc(doc(subtopicsCollectionRef, `sub-topics/${subtopic.id}`))
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }
}

export default deleteSubTopic