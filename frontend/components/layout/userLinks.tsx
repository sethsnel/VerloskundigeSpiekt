'use client'
import Link from 'next/link'
import { GrAddCircle } from 'react-icons/gr'

import { useUser } from '../../lib/auth/use-user'
import { useArticles } from '../../lib/hooks/articles'
import { getChannelLabels } from '../../content/labels'
import { Button } from '../button'
import { SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar } from '@/components/ui/sidebar'

const labels = getChannelLabels()

const UserLinks = ({ articleLinks }: { articleLinks: JSX.Element[] }) => {
  const { user } = useUser()
  const { addArticleMutation } = useArticles()
  const { setOpenMobile, state } = useSidebar()

  return (
    <>
      {!user?.hasContributeRights() ? undefined : (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={labels.createNote}
            className="bg-primary max-w-9/10 m-auto text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground duration-200 ease-linear"
            onClick={() => {
              addArticleMutation.mutate({ name: labels.initialArticleTitle, tagIds: [] })
              setOpenMobile(false)
            }}
          >
            <GrAddCircle />
            <span>{labels.createNote}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {
        (state === 'collapsed') ? (
          <SidebarSeparator />
        ) : <h2>{labels.articlesTitle}</h2>
      }
      {articleLinks}
    </>
  )
}

export default UserLinks
