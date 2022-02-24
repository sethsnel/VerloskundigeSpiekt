import { DefaultLayoutProps } from "../../components/layout"
import getArticles from "../firestore/articles/get-articles"

export default async function fetchLayoutProps(): Promise<DefaultLayoutProps> {
  const articles = await getArticles()

  return {
    articles
  }
}
