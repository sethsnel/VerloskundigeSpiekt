import type { NextPage } from 'next'

import { Users } from '../../../containers/admin'

import styles from '../../../styles/Article.module.scss'

const UsersPage: NextPage = () => {
  return (
    <div className={styles.container}>
      <h1>Gebruikersbeheer</h1>

      <main className={styles.main}>
        <Users />
      </main>
    </div>
  )
}

export default UsersPage
