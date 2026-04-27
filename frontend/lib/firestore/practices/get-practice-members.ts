import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PracticeMember } from '../../../schema/practice'
import { mapPracticeMemberDoc } from './get-practices-for-user'

const getPracticeMembers = async (practiceId: string): Promise<PracticeMember[]> => {
  const membersSnapshot = await getDocs(collection(firestoreDb, 'practices', practiceId, 'members'))
  return membersSnapshot.docs.map((memberDoc) => mapPracticeMemberDoc(memberDoc.id, practiceId, memberDoc.data()))
}

export default getPracticeMembers
