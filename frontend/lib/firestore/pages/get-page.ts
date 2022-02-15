import { collection, doc, getDoc } from 'firebase/firestore'

import { Page } from '../../../schema/page'
import { firestoreDb } from '../../../config/firebaseConfig'

const getPage = async (pageId: string): Promise<Page | undefined> => {
  try {
    const pagesRef = collection(firestoreDb, 'pages')
    const pageDoc = await getDoc(doc(pagesRef, pageId))

    return {
      id: pageDoc.id,
      ...pageDoc.data(),
    } as Page
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }

  return undefined
}

export default getPage
