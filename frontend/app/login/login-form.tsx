'use client'
import { useEffect } from 'react'
import { signInWithFirebase } from '../../lib/auth/firebase-auth'
import { getChannelLabels } from '../../content/labels'

import styles from '../../styles/Login.module.scss'
import 'firebaseui/dist/firebaseui.css'

const labels = getChannelLabels()

const LoginForm = () => {
  useEffect(() => {
    console.info('Login form')
    signInWithFirebase()
  }, [])

  return (
    <div className={styles.main}>
      <h1>{labels.articlesTitle}</h1>
      <div id="firebaseui-auth-container"></div>
    </div>
  )
}

export default LoginForm
