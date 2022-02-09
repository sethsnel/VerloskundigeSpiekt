import styles from '../styles/Login.module.scss'
import 'firebaseui/dist/firebaseui.css'

import type { NextPage } from 'next'
import Head from 'next/head'

import { signInWithFirebase } from '../lib/auth/firebase-auth'

const Login: NextPage = () => {
  if (typeof window !== 'undefined') {
    signInWithFirebase()
  }

  return (
    <>
      <Head>
        <title className={styles.title}>Verloskundige spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className={styles.main}>
        <h1>Verloskundige spiekt</h1>
        <div id="firebaseui-auth-container"></div>
      </div>
    </>
  )
}

export default Login
