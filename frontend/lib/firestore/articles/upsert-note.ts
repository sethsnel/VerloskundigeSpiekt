import { doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Note } from '../../../schema/article'
import revalidatePath from './revalidate'

const upsertNote = async (note: Note, articleId: string): Promise<Note | undefined> => {
  try {
    const articleDoc = doc(firestoreDb, 'articles', articleId)

    await updateDoc(articleDoc, {
      [`notes.${note.id}`]: { ...note },
    })

    revalidatePath(`/artikel/${articleId}`)
    return { ...note }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
}

export default upsertNote
