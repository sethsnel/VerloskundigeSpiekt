import { doc, getDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

const getMenuItems = async (): Promise<{ id: string, name: string }[]> => {
  console.info("GET MENU ITEMS")
  try {
    const docRef = doc(firestoreDb, 'menu', 'articles')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists() === false) {
      return []
    }

    return Object.entries(docSnap.data()).map(entry => ({ id: entry[0], name: entry[1] }))
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }

  return []
}

export default getMenuItems
