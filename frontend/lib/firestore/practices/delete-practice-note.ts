import { deleteField, doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'

const deletePracticeNote = async (practiceId: string, slug: string, noteId: string): Promise<string> => {
  await updateDoc(doc(firestoreDb, 'practices', practiceId, 'articles', slug), {
    [`notes.${noteId}`]: deleteField(),
  })

  return noteId
}

export default deletePracticeNote
