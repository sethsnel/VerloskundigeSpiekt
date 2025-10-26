'use client'
import { getAuth, EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth'

import firebaseApp from '../../config/firebaseConfig'

export const authInstance = getAuth(firebaseApp)
authInstance.languageCode = 'nl'

export async function signInWithFirebase() {
  if (typeof window !== 'undefined') {
    const firebaseui = await import('firebaseui')
    let firebaseUI: firebaseui.auth.AuthUI
    if (firebaseui.auth.AuthUI.getInstance()) {
      firebaseUI = <firebaseui.auth.AuthUI>firebaseui.auth.AuthUI.getInstance()
    } else {
      firebaseUI = new firebaseui.auth.AuthUI(authInstance)
    }

    firebaseUI.start('#firebaseui-auth-container', {
      signInFlow: 'popup',
      signInSuccessUrl: '/',
      signInOptions: [
        {
          provider: EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
        GoogleAuthProvider.PROVIDER_ID,
      ],
    })
  }
}
