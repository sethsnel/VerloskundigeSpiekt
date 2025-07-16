'use client'
import Link from 'next/link'

import { Article } from '../../schema/article'
import { Profile } from '../profile'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { useSidebar } from '@/components/ui/sidebar'

import styles from './menu.module.scss'
import UserLinks from './userLinks'
import SearchBar from './search-bar'

interface MenuProps {
  articles: Article[]
}

const Menu = ({ articles }: MenuProps) => {
  const { setOpenMobile } = useSidebar()

  const articleLinks = articles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((article) => (
      <div key={article.id} className={styles.item}>
        <Link href={`/artikel/${article.id}`} prefetch={false} onClick={() => setOpenMobile(false)}>
          {article.name}
        </Link>
      </div>
    ))

  let devNotice: JSX.Element | undefined = undefined

  if (process.env.NODE_ENV === 'development') {
    devNotice = <h1>DEV</h1>
  }

  const menuBody = (
    <>
      {devNotice}
      <Profile />
      <SearchBar />
      <div className={styles.top}>
        <div className={styles.main}>
          <Link href={`/`} onClick={() => setOpenMobile(false)}>
            Home
          </Link>
          <Link href={`/tags`} onClick={() => setOpenMobile(false)}>
            Tags
          </Link>
        </div>
      </div>
      <UserLinks articleLinks={articleLinks} />
    </>
  )

  return (
    <>
      <nav className={`hidden md:flex ${styles.nav}`}>{menuBody}</nav>
      <AppSidebar>{menuBody}</AppSidebar>
    </>
  )
}

export default Menu
