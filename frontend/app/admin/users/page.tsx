import type { NextPage } from 'next'

import { Users } from '../../../containers/admin'
import ReindexButton from '../../../components/admin/reindex'
import IndexMenu from '../../../components/admin/index-menu'

import styles from '../../../styles/Article.module.scss'

const UsersPage: NextPage = () => {
  return (
    <div className={styles.container}>
      <h1>Gebruikersbeheer</h1>

      <main className={styles.main}>
        <div className="d-flex flex-column gap-4">
          <div className="card p-3">
            <h3>Zoekfunctie beheer</h3>
            <ReindexButton />
          </div>
          <div className="card p-3">
            <h3>Menu beheer</h3>
            <IndexMenu />
          </div>

          <div className="card p-3">
            <h3>Gebruikers</h3>
            <Users />
          </div>
        </div>
      </main>
    </div>
  )
}

export default UsersPage
