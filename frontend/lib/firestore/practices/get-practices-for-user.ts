import { collection, doc, getDoc, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Practice, PracticeMember, PracticeWithRole } from '../../../schema/practice'

export const mapPracticeDoc = (id: string, data: Record<string, any>): Practice => ({
  id,
  name: data.name ?? '',
  ownerId: data.ownerId,
  address: data.address ?? {},
  createdAt: data.createdAt ?? null,
})

export const mapPracticeMemberDoc = (id: string, practiceId: string, data: Record<string, any>): PracticeMember => ({
  id,
  practiceId,
  userId: data.userId ?? id,
  role: data.role ?? 'user',
  email: data.email ?? null,
  displayName: data.displayName ?? null,
  createdAt: data.createdAt ?? null,
})

const getPracticesForUser = async (userId: string): Promise<PracticeWithRole[]> => {
  const practicesSnapshot = await getDocs(collection(firestoreDb, 'practices'))
  const practices = await Promise.all(
    practicesSnapshot.docs.map(async (practiceDoc) => {
      const memberDoc = await getDoc(doc(firestoreDb, 'practices', practiceDoc.id, 'members', userId))
      if (!memberDoc.exists()) {
        return undefined
      }

      const practice = mapPracticeDoc(practiceDoc.id, practiceDoc.data())
      const member = mapPracticeMemberDoc(memberDoc.id, practiceDoc.id, memberDoc.data())
      return {
        ...practice,
        role: member.role,
      }
    })
  )

  return practices.filter(Boolean) as PracticeWithRole[]
}

export default getPracticesForUser
