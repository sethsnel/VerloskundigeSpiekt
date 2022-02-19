import Link from 'next/link'

import { Article } from '../../schema/article'
import { Profile } from '../profile'

import styles from './menu.module.scss'

interface MenuProps {
  articles: Article[]
}

const Menu = ({ articles }: MenuProps) => {
  const articleLinks = articles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((article) => (
      <div key={article.id} className={styles.item}>
        <Link href={`/artikel/${article.id}`} prefetch={false}>
          <a>{article.name}</a>
        </Link>
      </div>
    ))

  return (
    <>
      <nav className={styles.nav}>
        <Profile />
        <p>
          <Link href={`/`}>
            <a>Home</a>
          </Link>
        </p>
        <h2>Spiekbriefjes</h2>
        {articleLinks}
      </nav>
    </>
  )
}

export default Menu
