import { doc, deleteField, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import revalidatePath from './revalidate'

const deleteNote = async (noteId: string, articleId: string): Promise<string | undefined> => {
  try {
    const articleDoc = doc(firestoreDb, 'articles', articleId)

    await updateDoc(
      articleDoc,
      { [`notes.${noteId}`]: deleteField() }
    )

    return noteId
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
  revalidatePath(`/artikel/${articleId}`)
}

export default deleteNote