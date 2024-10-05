'use client'
import { signInWithFirebase } from '../../lib/auth/firebase-auth'

import styles from '../../styles/Login.module.scss'
import 'firebaseui/dist/firebaseui.css'

const LoginForm = () => {
  if (typeof window !== 'undefined') {
    signInWithFirebase()
  }

  return (
    <div className={styles.main}>
      <h1>Recepten</h1>
      <div id="firebaseui-auth-container"></div>
    </div>
  )
}

export default LoginForm
