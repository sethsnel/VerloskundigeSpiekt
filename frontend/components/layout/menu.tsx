'use client'
import Link from 'next/link'
import { FaHome, FaTags, FaWeight, FaUsers } from 'react-icons/fa'

import { Article } from '../../schema/article'
import { Profile } from '../profile'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

import UserLinks from './userLinks'
import SearchBar from './search-bar'
import { useUser } from '@/lib/auth/use-user'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

interface MenuProps {
  articles: Article[]
}

const Menu = ({ articles }: MenuProps) => {
  const { setOpenMobile, state } = useSidebar()
  const { user } = useUser()

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

  if (user?.hasAdminRights()) {
    items.push({
      title: "Gebruikersbeheer",
      url: "/admin/users",
      icon: FaUsers
    })
  }

  const sortedArticle = articles.sort((a, b) => a.name.localeCompare(b.name))
  const groupedArticle = Map.groupBy(sortedArticle, article => article.name[0].toUpperCase())

  const getArticleMenuItems = (articles: Article[]) =>
    articles
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((article) => (
        <SidebarMenuItem key={article.id}>
          <SidebarMenuButton asChild>
            <Link href={`/artikel/${article.id}`} prefetch={false} onClick={() => setOpenMobile(false)}>
              <span>{article.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))

  const articleLinks = groupedArticle.entries().map(([letter, articles]) => {
    return <Collapsible className="group/collapsible" key={letter}>
      <SidebarGroup>
        {
          state == 'collapsed' ? (<CollapsibleTrigger>
            {letter}
          </CollapsibleTrigger>) :
            (<SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                {letter}
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>)
        }

        <CollapsibleContent>
          <SidebarMenuSub>
            {getArticleMenuItems(articles)}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarGroup >
    </Collapsible >
  })


  // const articleA = [(
  //   <Collapsible className="group/collapsible" key="A">
  //     <SidebarGroup>
  //       <SidebarGroupLabel asChild>
  //         <CollapsibleTrigger>
  //           A
  //           <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
  //         </CollapsibleTrigger>
  //       </SidebarGroupLabel>
  //       <CollapsibleContent>
  //         <SidebarMenuSub>
  //           {articleLinks}
  //         </SidebarMenuSub>
  //       </CollapsibleContent>
  //     </SidebarGroup>
  //   </Collapsible>
  // )]

  const menuBody = (
    <>
      <Profile />
      <SearchBar />
      <SidebarMenu>
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
      </SidebarMenu>
      <SidebarMenu>
        <UserLinks articleLinks={articleLinks.toArray()} />
      </SidebarMenu>
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
