'use client'
import Link from 'next/link'
import { FaHome, FaTags, FaWeight, FaUsers, FaHospital, FaAddressBook, FaCopy } from 'react-icons/fa'

import { Article } from '../../schema/article'
import { Profile } from '../profile'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

import UserLinks from './userLinks'
import SearchBar from './search-bar'
import { useUser } from '@/lib/auth/use-user'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'

interface MenuProps {
  articles: Article[]
}

const Menu = ({ articles }: MenuProps) => {
  const { setOpenMobile, state, isMobile } = useSidebar()
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
      title: "Contacten",
      url: "/artikel/LesCnRcM5bwiNpM1oJdZ",
      icon: FaAddressBook,
    },
    {
      title: "Ziekenhuizen",
      url: "/artikel/oQBToFdcvTSal8kV3tSv",
      icon: FaHospital,
    },
    {
      title: "Sjablonen",
      url: "/artikel/k58Ds0rTFkFRnqLMwRvR",
      icon: FaCopy,
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
  const groupedArticle = Map.groupBy(sortedArticle, article => {
    if (isNaN(article.name[0] as unknown as number)) {
      return article.name[0].toUpperCase()
    }
    else {
      return '0'
    }
  })

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
    if (state === 'collapsed' && !isMobile) {
      return <DropdownMenu key={letter}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className='cursor-pointer justify-center text-md max-w-9/10 m-auto min-h-8'>
            {letter}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>
            {isNaN(letter as unknown as number) ? `${letter}` : '0-9'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {getArticleMenuItems(articles)}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    }
    else {
      return <Collapsible className="group/collapsible" key={letter}>
        <SidebarGroup className='px-2'>
          <SidebarGroupLabel asChild className='text-md'>
            <CollapsibleTrigger>
              {letter}
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarMenuSub>
              {getArticleMenuItems(articles)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarGroup >
      </Collapsible>
    }
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
      <SearchBar inSidebar={true} />
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} className='max-w-9/10 m-auto'>
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarMenu className='overflow-auto'>
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
