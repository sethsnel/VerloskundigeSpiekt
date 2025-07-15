'use client'
import Link from 'next/link'

import { useUser } from '../../lib/auth/use-user'
import { useArticles } from '../../lib/hooks/articles'
import { getChannelLabels } from '../../content/labels'
import { Button } from '../button'

const labels = getChannelLabels()

const UserLinks = ({ articleLinks }: { articleLinks: JSX.Element[] }) => {
  const { user } = useUser()
  const { addArticleMutation } = useArticles()

  return (
    <>
      {user?.hasAdminRights() ? (
        <Link href={`/admin/users`}>
          <Button variant="outline" icon="edit">
            Gebruikersbeheer
          </Button>
        </Link>) : undefined}
      {!user?.hasContributeRights() ? undefined : (
        <Button variant="outline" icon="add" onClick={() => addArticleMutation.mutate({ name: labels.initialArticleTitle, tagIds: [] })}>
          {labels.createNote}
        </Button>
      )}

      <h2>{labels.articlesTitle}</h2>
      {articleLinks}
    </>
  )
}

export default UserLinks
