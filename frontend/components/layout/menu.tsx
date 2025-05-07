'use client'
import Link from 'next/link'
import dynamic from "next/dynamic"

import { Article } from '../../schema/article'
import { Profile } from '../profile'

import styles from './menu.module.scss'
import UserLinks from './userLinks'
import SearchBar from './search-bar'

const OffcanvasMenu = dynamic(() => import('./offcanvas-menu').then((mod) => mod.default), {
  ssr: false,
})

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

  const menuBody = <>
    {devNotice}
    <Profile />
    <SearchBar />
    <div className={styles.top}>
      <div className={styles.main}>
        <Link href={`/`}>
          Home
        </Link>
        <Link href={`/tags`}>
          Tags
        </Link>
      </div>
    </div>
    <UserLinks articleLinks={articleLinks} />
  </>

  return (
    <>
      <nav className={`d-none d-md-block ${styles.nav}`}>
        {menuBody}
      </nav>
      <OffcanvasMenu>
        {menuBody}
      </OffcanvasMenu>
    </>
  )
}

export default Menu
