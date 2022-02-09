import { collection, doc, DocumentReference, setDoc, addDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import SubTopic from '../../../schema/sub-topic'
import { setParentTopic } from '../topics'

const upsertSubTopic = async (subtopic: SubTopic, topicId: string): Promise<string | undefined> => {
  try {
    const subtopicsCollectionRef = collection(firestoreDb, "sub-topics")

    let subtopicRef: DocumentReference
    if (subtopic.id) {
      //Update doc if it exsist
      subtopicRef = doc(subtopicsCollectionRef, subtopic.id)
      await setDoc(subtopicRef, {
        ...subtopic
      })
    }
    else {
      //Create doc if new
      subtopicRef = await addDoc(subtopicsCollectionRef, {
        ...subtopic
      })

      //Create parent-child relation
      await setParentTopic(topicId, subtopicRef.id)
    }

    return subtopicRef.id
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }
}

export default upsertSubTopic