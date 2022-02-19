import { collection, doc, getDoc } from 'firebase/firestore'

import { Article } from '../../../schema/article'
import { firestoreDb } from '../../../config/firebaseConfig'

const getArticle = async (articleId: string): Promise<Article | undefined> => {
  try {
    const articlesRef = collection(firestoreDb, 'articles')
    const articleDoc = await getDoc(doc(articlesRef, articleId))

    return {
      id: articleDoc.id,
      ...articleDoc.data(),
    } as Article
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }

  return undefined
}

export default getArticle
