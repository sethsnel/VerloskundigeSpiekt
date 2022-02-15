import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Page } from '../../../schema/page'

const getPages = async (): Promise<Page[]> => {
  try {
    const pageSnapshots = await getDocs(collection(firestoreDb, `pages`))
    const pages: Page[] = []

    pageSnapshots.forEach((doc) => {
      pages.push({
        id: doc.id,
        ...doc.data(),
      } as Page)
    })

    return pages
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error)
    }
  }

  return []
}

export default getPages
