import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getTopics } from '../../lib/firestore/topics'
import Topic, { mockTopics } from '../../schema/topic'
import { Profile } from '../profile'

import styles from './menu.module.scss'

const Menu = () => {
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    const fetchTopics = async () => {
      setTopics(await getTopics())
    }

    fetchTopics()
  }, [])

  const topicLinks = topics.map(topic =>
    <div key={topic.id} className={styles.item}>
      <Link href={`/onderwerp/${topic.id}`}>
        <a>{topic.name}</a>
      </Link>
    </div>
  )

  return (
    <>
      <nav className={styles.nav}>
        <h2>Onderwerpen</h2>
        {topicLinks}
        <Profile />
      </nav>
    </>
  )
}

export default Menu
