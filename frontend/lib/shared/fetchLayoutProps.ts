//import { unstable_cacheTag as cacheTag } from 'next/cache'

import { DefaultLayoutProps } from "../../components/layout"
import getArticles from "../firestore/articles/get-articles"

export default async function fetchLayoutProps(): Promise<DefaultLayoutProps> {
  // 'use cache'
  const articles = await getArticles()
  // cacheTag('layout-props')

  return {
    articles
  }
}
