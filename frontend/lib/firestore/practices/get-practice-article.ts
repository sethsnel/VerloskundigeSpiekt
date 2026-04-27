import { doc, getDoc, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { ArticlePractice } from '../../../schema/practice'
import { PRACTICE_ARTICLE_TITLES } from './constants'

const getPracticeArticle = async (practiceId: string, slug: string): Promise<ArticlePractice> => {
  const articleRef = doc(firestoreDb, 'practices', practiceId, 'articles', slug)
  const articleDoc = await getDoc(articleRef)

  if (articleDoc.exists()) {
    return {
      id: articleDoc.id,
      slug,
      ...articleDoc.data(),
    } as ArticlePractice
  }

  const article = {
    id: slug,
    slug,
    name: PRACTICE_ARTICLE_TITLES[slug] ?? slug,
    tagIds: [],
    notes: {},
  }

  await setDoc(articleRef, article)
  return article
}

export default getPracticeArticle
