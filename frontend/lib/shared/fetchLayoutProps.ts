//import { unstable_cacheTag as cacheTag } from 'next/cache'

import { DefaultLayoutProps } from "../../components/layout"

export default async function fetchLayoutProps(): Promise<DefaultLayoutProps> {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
  const response = await fetch(`${apiBaseUrl}/api/v1/articles`, { next: { revalidate: 60 } }).catch(() => undefined)
  const articles = response?.ok ? await response.json() as Array<{ id: string; title: string }> : []
  const menuItems = articles.map(article => ({ id: article.id, name: article.title }))

  return {
    menuItems
  }
}
