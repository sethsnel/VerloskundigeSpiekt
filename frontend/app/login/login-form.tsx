'use client'
import { useEffect } from 'react'
import { signInWithFirebase } from '../../lib/auth/firebase-auth'

import styles from '../../styles/Login.module.scss'
import 'firebaseui/dist/firebaseui.css'

const LoginForm = () => {
  useEffect(() => {
    console.info('Login form')
    signInWithFirebase()
  }, [])

  return (
    <div className={styles.main}>
      <h1>Spiekbriefjes</h1>
      <div id="firebaseui-auth-container"></div>
    </div>
  )
}

export default LoginForm
