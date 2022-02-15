import Link from 'next/link'

import Topic from '../../schema/topic'
import { Profile } from '../profile'

import styles from './menu.module.scss'

interface MenuProps {
  topics: Topic[]
}

const Menu = ({ topics }: MenuProps) => {
  const topicLinks = topics
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((topic) => (
      <div key={topic.id} className={styles.item}>
        <Link href={`/onderwerp/${topic.id}`} prefetch={false}>
          <a>{topic.name}</a>
        </Link>
      </div>
    ))

  return (
    <>
      <nav className={styles.nav}>
        <Profile />
        <p>
          <Link href={`/`}>
            <a>Home</a>
          </Link>
        </p>
        <h2>Spiekbriefjes</h2>
        {topicLinks}
      </nav>
    </>
  )
}

export default Menu
