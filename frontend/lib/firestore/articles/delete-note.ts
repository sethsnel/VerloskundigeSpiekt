import { doc, deleteField, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

const deleteNote = async (noteId: string, articleId: string): Promise<void> => {
  try {
    const articleDoc = doc(firestoreDb, 'articles', articleId)

    await updateDoc(
      articleDoc,
      { [`notes.${noteId}`]: deleteField() }
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
}

export default deleteNote