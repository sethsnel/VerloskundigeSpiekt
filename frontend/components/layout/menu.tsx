'use client'
import Link from 'next/link'
import { FaHome, FaTags, FaWeight } from 'react-icons/fa'

import { Article } from '../../schema/article'
import { Profile } from '../profile'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

import styles from './menu.module.scss'
import UserLinks from './userLinks'
import SearchBar from './search-bar'

interface MenuProps {
  articles: Article[]
}

const items = [
  {
    title: "Home",
    url: "/",
    icon: FaHome,
  },
  {
    title: "Tags",
    url: "/tags",
    icon: FaTags,
  },
  {
    title: "Gewicht",
    url: "/gewicht",
    icon: FaWeight,
  }
]

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
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <UserLinks articleLinks={articleLinks} />
    </>
  )

  return (
    <>
      {/* <nav className={`hidden md:flex ${styles.nav}`}>{menuBody}</nav> */}
      <AppSidebar>{menuBody}</AppSidebar>
    </>
  )
}

export default Menu
