'use client'
import Link from 'next/link'

import { useUser } from '../../lib/auth/use-user'
import { useArticles } from '../../lib/hooks/articles'
import { getChannelLabels } from '../../content/labels'
import { Button } from '../button'
import { useSidebar } from '@/components/ui/sidebar'

const labels = getChannelLabels()

const UserLinks = ({ articleLinks }: { articleLinks: JSX.Element[] }) => {
  const { user } = useUser()
  const { addArticleMutation } = useArticles()
  const { setOpenMobile } = useSidebar()

  return (
    <>
      {user?.hasAdminRights() ? (
        <Link href={`/admin/users`} onClick={() => setOpenMobile(false)}>
          <Button variant="outline" icon="edit">
            Gebruikersbeheer
          </Button>
        </Link>
      ) : undefined}
      {!user?.hasContributeRights() ? undefined : (
        <Button
          variant="outline"
          icon="add"
          onClick={() => {
            addArticleMutation.mutate({ name: labels.initialArticleTitle, tagIds: [] })
            setOpenMobile(false)
          }}>
          {labels.createNote}
        </Button>
      )}

      <h2>{labels.articlesTitle}</h2>
      {articleLinks}
    </>
  )
}

export default UserLinks
