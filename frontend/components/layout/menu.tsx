import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getTopics } from '../../lib/firestore/topics'
import Topic, { mockTopics } from '../../schema/topic'
import { Profile } from '../profile'

import styles from './menu.module.scss'

interface MenuProps {
  topics: Topic[]
}

const Menu = ({ topics }: MenuProps) => {
  const topicLinks = topics
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(topic =>
      <div key={topic.id} className={styles.item}>
        <Link href={`/onderwerp/${topic.id}`} prefetch={false}>
          <a>{topic.name}</a>
        </Link>
      </div>
    )

  return (
    <>
      <nav className={styles.nav}>
        <Profile />
        <h2>Spiekbriefjes</h2>
        <div key='home' className={styles.item}>
          <Link href={`/`}>
            <a>Home</a>
          </Link>
        </div>
        {topicLinks}
      </nav>
    </>
  )
}

export default Menu
