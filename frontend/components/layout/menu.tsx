import Link from 'next/link'

import { Article } from '../../schema/article'
import { Profile } from '../profile'

import styles from './menu.module.scss'
import UserLinks from './userLinks'

interface MenuProps {
  articles: Article[]
}

const Menu = ({ articles }: MenuProps) => {
  const articleLinks = articles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((article) => (
      <div key={article.id} className={styles.item}>
        <Link href={`/artikel/${article.id}`} prefetch={false}>
          {article.name}
        </Link>
      </div>
    ))

  let devNotice: JSX.Element | undefined = undefined

  if (process.env.NODE_ENV === 'development') {
    devNotice = <h1>DEV</h1>
  }

  return (
    <>
      <nav className={styles.nav}>
        {devNotice}
        <Profile />
        <div className={styles.top}>
          <div className={styles.main}>
            <Link href={`/`}>
              Home
            </Link>
          </div>
        </div>
        <UserLinks articleLinks={articleLinks} />
      </nav>
    </>
  )
}

export default Menu
