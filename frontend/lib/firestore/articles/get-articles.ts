import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Article } from '../../../schema/article'

const getArticles = async (): Promise<Article[]> => {
  try {
    const articleSnapshots = await getDocs(collection(firestoreDb, `articles`))
    const articles: Article[] = []

    articleSnapshots.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data(),
      } as Article)
    })

    return articles
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }

  return []
}

export default getArticles
