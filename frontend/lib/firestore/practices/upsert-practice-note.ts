import { doc, updateDoc } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Note } from '../../../schema/article'

const upsertPracticeNote = async (practiceId: string, slug: string, note: Note): Promise<Note> => {
  await updateDoc(doc(firestoreDb, 'practices', practiceId, 'articles', slug), {
    [`notes.${note.id}`]: { ...note },
  })

  return note
}

export default upsertPracticeNote
