import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Tag } from '../../../schema/article'

const getTags = async (fitlerTagIds?: string[]) => {
  console.info("GET TAGS")
  const tagSnapshots = await getDocs(collection(firestoreDb, `tags`))
  const tags: Tag[] = []

  tagSnapshots.forEach((doc) => {
    tags.push({
      id: doc.id,
      ...doc.data(),
    } as Tag)
  })

  return tags
}

export default getTags
