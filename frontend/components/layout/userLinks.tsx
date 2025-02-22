'use client'
import Link from 'next/link'

import { useUser } from '../../lib/auth/use-user'
import { useArticles } from '../../lib/hooks/articles'
import { Button } from '../button'

const UserLinks = ({ articleLinks }: { articleLinks: JSX.Element[] }) => {
  const { user } = useUser()
  const { addArticleMutation } = useArticles()

  return (
    <>
      {user?.hasAdminRights() ? (
        <Link href={`/admin/users`}>
          <Button icon="edit">
            Gebruikersbeheer
          </Button>
        </Link>) : undefined}
      {!user?.hasContributeRights() ? undefined : (
        <Button icon="add" onClick={() => addArticleMutation.mutate({ name: 'A - Nieuw spiekbriefje' })}>
          maak spiekbriefje
        </Button>
      )}

      <h2>Spiekbriefjes</h2>
      {articleLinks}
    </>
  )
}

export default UserLinks
