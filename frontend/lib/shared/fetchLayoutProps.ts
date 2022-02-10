import { getTopics } from "../firestore/topics"

export default async function fetchLayoutProps() {
  const topics = await getTopics()

  return {
    topics
  }
}
