import Link from 'next/link'

import { useUser } from '../../lib/auth/use-user'
import { useArticles } from '../../lib/hooks/articles'
import { Article } from '../../schema/article'
import { Button } from '../button'
import { Profile } from '../profile'

import styles from './menu.module.scss'

interface MenuProps {
  articles: Article[]
}

const Menu = ({ articles }: MenuProps) => {
  const { user } = useUser()
  const { addArticleMutation } = useArticles()

  const articleLinks = articles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((article) => (
      <div key={article.id} className={styles.item}>
        <Link href={`/artikel/${article.id}`} prefetch={false}>
          <a>{article.name}</a>
        </Link>
      </div>
    ))

  let devNotice: JSX.Element | undefined = undefined

  if (process.env.NODE_ENV === 'development') {
    devNotice = <h1>DEV</h1>
  }

  return (
    <>
      <nav className={styles.nav}>
        {devNotice}
        <Profile />
        <div className={styles.top}>
          <div className={styles.main}>
            <Link href={`/`}>
              <a>Home</a>
            </Link>
          </div>
          {user?.hasAdminRights() ? (
            <div className={styles.main}>
              <Link href={`/admin/users`}>
                <a>Gebruikersbeheer</a>
              </Link>
            </div>
          ) : undefined}
        </div>
        {!user?.hasContributeRights() ? undefined : (
          <Button icon="add" onClick={() => addArticleMutation.mutate({ name: 'A - Nieuw Recept' })}>
            maak recept
          </Button>
        )}
        {
          user ? <>
            <h2>Recepten</h2>
            {articleLinks}
          </> : undefined
        }
      </nav>
    </>
  )
}

export default Menu
