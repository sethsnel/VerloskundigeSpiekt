import { doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Note } from '../../../schema/article'

const upsertNote = async (note: Note, articleId: string): Promise<Note | undefined> => {
  try {
    const articleDoc = doc(firestoreDb, 'articles', articleId)

    await updateDoc(
      articleDoc,
      {
        [`notes.${note.id}`]: { ...note }
      }
    )

    return { ...note }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
}

export default upsertNote