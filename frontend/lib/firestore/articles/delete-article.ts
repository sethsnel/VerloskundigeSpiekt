import { doc, deleteDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import revalidatePath from './revalidate'

const deleteArticle = async (articleId: string): Promise<string> => {
  try {
    await deleteDoc(
      doc(firestoreDb, 'articles', articleId)
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
  revalidatePath('/', 'layout')

  return articleId
}

export default deleteArticle