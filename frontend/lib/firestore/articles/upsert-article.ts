import { doc, updateDoc, setDoc, collection } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Article, UpdateArticle } from '../../../schema/article'
import revalidatePath from './revalidate'

const upsertArticle = async (article: UpdateArticle): Promise<Article | undefined> => {
  try {
    let { id, ...updatedArticle } = article

    if (id) {
      const articleToUpdateRef = doc(firestoreDb, 'articles', id)

      await updateDoc(
        articleToUpdateRef,
        { ...updatedArticle }
      )
    }
    else {
      const newArticleRef = doc(collection(firestoreDb, 'articles'))
      id = newArticleRef.id

      await setDoc(
        newArticleRef,
        { ...updatedArticle }
      )
    }
    revalidatePath('/', 'layout')

    return { id, ...updatedArticle }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
}

export default upsertArticle