import { collection, getDoc, getDocs, doc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import SubTopic from '../../../schema/sub-topic'

const getSubTopics = async (topicId: string): Promise<SubTopic[]> => {
  try {
    const topicChildren = await getDocs(collection(firestoreDb, `topics/${topicId}/children`))
    const subTopicIds: string[] = []

    topicChildren.forEach(async (topicChild) => {
      subTopicIds.push(topicChild.id)
    })

    const subtopicsCollectionRef = collection(firestoreDb, "sub-topics")

    const subtopics: SubTopic[] = await Promise.all(
      subTopicIds.map(async subTopicId => {
        const subTopicDoc = await getDoc(doc(subtopicsCollectionRef, subTopicId))
        const subTopic = subTopicDoc.data()
        return {
          id: subTopicDoc.id,
          name: subTopic?.name,
          text: subTopic?.text,
        }
      })
    )

    return subtopics
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }

  return []
}

export default getSubTopics