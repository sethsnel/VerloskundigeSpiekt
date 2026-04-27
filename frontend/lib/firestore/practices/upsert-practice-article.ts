import { doc, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { ArticlePractice } from '../../../schema/practice'

const upsertPracticeArticle = async (practiceId: string, article: ArticlePractice): Promise<ArticlePractice> => {
  await setDoc(
    doc(firestoreDb, 'practices', practiceId, 'articles', article.slug),
    article,
    { merge: true }
  )

  return article
}

export default upsertPracticeArticle
