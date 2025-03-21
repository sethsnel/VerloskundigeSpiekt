import { doc, updateDoc, setDoc, collection } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Tag, UpsertTag } from '../../../schema/article'
import revalidatePath from '../articles/revalidate'

const upsertTag = async (tag: UpsertTag) => {
  let { id, ...updatedTag } = tag

  if (id) {
    const tagToUpdateRef = doc(firestoreDb, 'tags', id)

    await updateDoc(
      tagToUpdateRef,
      { ...updatedTag }
    )
  }
  else {
    const newTagRef = doc(collection(firestoreDb, 'tags'))
    id = newTagRef.id

    await setDoc(
      newTagRef,
      { ...updatedTag }
    )
  }
  revalidatePath('/', 'layout')

  return { id, ...updatedTag }
}

export default upsertTag