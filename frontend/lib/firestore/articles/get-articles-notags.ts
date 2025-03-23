import { collection, getDocs, query, where } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { Article } from '../../../schema/article'

export const getArticlesWithoutTags = async (): Promise<Article[]> => {
  try {
    // First approach: Query for articles where tagIds is null or doesn't exist
    const articlesRef = collection(firestoreDb, 'articles')
    const nullTagsQuery = query(articlesRef, where('tagIds', '==', null))
    const emptyTagsQuery = query(articlesRef, where('tagIds', '==', []))

    // Execute both queries
    const nullTagsSnapshot = await getDocs(nullTagsQuery)
    const emptyTagsSnapshot = await getDocs(emptyTagsQuery)

    // Combine results
    const articlesWithoutTags: Article[] = []

    // Process articles with null tagIds
    nullTagsSnapshot.forEach(doc => {
      const article = { id: doc.id, ...doc.data() } as Article
      articlesWithoutTags.push(article)
    })

    // Process articles with empty tagIds array
    emptyTagsSnapshot.forEach(doc => {
      const article = { id: doc.id, ...doc.data() } as Article
      articlesWithoutTags.push(article)
    })

    return articlesWithoutTags
  } catch (error) {
    console.error('Error fetching articles without tags:', error)
    return []
  }
}

export default getArticlesWithoutTags