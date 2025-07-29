import { doc, updateDoc, setDoc, collection } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { UpsertArticle } from '../../../schema/article'
import revalidatePath from './revalidate'

const upsertArticle = async (article: UpsertArticle) => {
  let { id, ...updatedArticle } = article

  if (id) {
    const articleToUpdateRef = doc(firestoreDb, 'articles', id)

    if (!updatedArticle.tagIds) {
      updatedArticle.tagIds = []
    }

    await updateDoc(
      articleToUpdateRef,
      { ...updatedArticle }
    )
    const menuItemRef = doc(firestoreDb, 'menu', 'articles')
    await updateDoc(menuItemRef, {
      [articleToUpdateRef.id]: updatedArticle.name
    })
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
}

export default upsertArticle