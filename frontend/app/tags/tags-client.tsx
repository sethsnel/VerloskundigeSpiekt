'use client'

import Link from 'next/link'
import { useQuery } from 'react-query'
import { generatedApi } from '../../lib/api/generated'
import { Button } from '../../components/button'
import styles from './tags.module.scss'

export default function TagsClient({ tagId, untagged = false }: { tagId?: string; untagged?: boolean }) {
  const query = useQuery(['api', 'public-tags'], async () => { const [tags, articles] = await Promise.all([generatedApi.listTags(), generatedApi.listArticles()]); return { tags, articles } })
  if (!query.data) return <div className="spinner-grow" role="status" />
  const { tags, articles } = query.data
  if (tagId) {
    const tag = tags.find(item => item.id === tagId); if (!tag) return <p>Tag niet gevonden.</p>
    return <div className="container mt-4"><h1>Tag: {tag.name}</h1><Link href="/tags"><Button variant="link" icon="back">Alle tags</Button></Link><div className="row">{tag.articleIds.map(id => { const article = articles.find(item => item.id === id); return <div className="col" key={id}><h2>{article?.title ?? id}</h2><Link href={`/artikel/${article?.slug ?? id}`}>Bekijk artikel</Link></div> })}</div></div>
  }
  const untaggedArticles = articles.filter(article => article.tagIds.length === 0)
  if (untagged) return <div className="container mt-4"><h1>Artikelen zonder tags</h1><Link href="/tags"><Button variant="link" icon="back">Alle tags</Button></Link>{untaggedArticles.map(article => <p key={article.id}><Link href={`/artikel/${article.slug}`}>{article.title}</Link></p>)}</div>
  return <div className="container mt-4"><div className="d-flex justify-content-between"><h1>Alle Tags</h1>{untaggedArticles.length > 0 && <Link href="/tags/untagged">Artikelen zonder tags ({untaggedArticles.length})</Link>}</div><div className={styles.tagGrid}>{tags.filter(tag => tag.articleIds.length > 0).map(tag => <Link href={`/tags/${tag.id}`} key={tag.id} className={styles.tagCard}><div className="card"><div className="card-body"><h2>{tag.name}</h2><p>{tag.articleIds.length} artikelen</p></div></div></Link>)}</div></div>
}
