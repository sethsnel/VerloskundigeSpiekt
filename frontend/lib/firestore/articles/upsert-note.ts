import { doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Note } from '../../../schema/article'

const upsertNote = async (note: Note, articleId: string): Promise<void> => {
  try {
    const articleDoc = doc(firestoreDb, 'articles', articleId)

    await updateDoc(
      articleDoc,
      {
        [`notes.${note.id}`]: { ...note }
      }
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
}

export default upsertNote