import { ReactNode } from 'react'

import { Content, HorizontalMenu, Menu } from '..'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface DefaultLayout {
  children: ReactNode
}

type MenuItem = {
  id: string
  name: string
}

export type DefaultLayoutProps = {
  menuItems: MenuItem[]
}

const DefaultLayout = ({ children, menuItems: articles }: DefaultLayoutProps & { children: ReactNode }) => {
  if (!articles || articles.length < 1) {
    articles = []
  }

  return (
    <>
      <Menu articles={articles} />
      <div className="sm:flex w-full bg-(--background-color)">
        <SidebarTrigger className="fixed bottom-0 sm:static" />
        <Content>
          <HorizontalMenu />
          {children}
        </Content>
      </div>
    </>
  )

}

export default DefaultLayout
