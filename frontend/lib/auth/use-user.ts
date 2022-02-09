import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import firebase from 'firebase/app'
import 'firebase/auth'

import {
  removeUserCookie,
  setUserCookie,
  getUserFromCookie,
} from './user-cookies'
import { mapUserData } from './map-user-data'
import { authInstance } from './firebase-auth'
import { Unsubscribe } from 'firebase/auth'

const useUser = () => {
  const [user, setUser] = useState<any | undefined>()
  const router = useRouter()

  const logout = async () => {
    return authInstance
      .signOut()
      .then(() => {
        router.push('/login')
      })
      .catch((e) => {
        console.error(e)
      })
  }

  useEffect(() => {
    // Firebase updates the id token every hour, this
    // makes sure the react state and the cookie are
    // both kept up to date
    const cancelAuthListener = authInstance.onIdTokenChanged((user) => {
      if (user) {
        const userData = mapUserData(user)
        //setUserCookie(userData)
        setUser(userData)
      } else {
        //removeUserCookie()
        setUser(undefined)
      }
    })

    // const userFromCookie = getUserFromCookie()
    // if (!userFromCookie) {
    //   router.push('/')
    //   return
    // }
    // setUser(userFromCookie)

    return () => {
      cancelAuthListener && cancelAuthListener()
    }
  }, [])

  return { user, logout }
}

export { useUser }
