import { collection, doc, DocumentReference, setDoc, addDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import Topic from '../../../schema/topic'

const upsertTopic = async (topic: Topic): Promise<string | undefined> => {
  try {
    const topicsCollectionRef = collection(firestoreDb, "topics")

    let topicRef: DocumentReference
    if (topic.id) {
      //Update doc if it exsist
      topicRef = doc(topicsCollectionRef, topic.id)
      await setDoc(topicRef, {
        ...topic
      })
    }
    else {
      //Create doc if new
      topicRef = await addDoc(topicsCollectionRef, {
        ...topic
      })
    }

    return topicRef.id
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }
}

export default upsertTopic