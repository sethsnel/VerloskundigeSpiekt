import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'

import styles from '../styles/Home.module.scss'

const Home: NextPage = () => {
  // useEffect(() => {
  //   const fetchTopic = async () => {
  //     await getTopics()
  //   }
  //   fetchTopic()
  // })

  return (
    <div>
      <Head>
        <title className={styles.title}>Verloskundige spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <h1 className={styles.title}>Verloskundige spiekt</h1>

      <main className={styles.main}>
      </main>
    </div>
  )
}

export default Home
