'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import 'firebase/auth'

import { mapUserData } from './map-user-data'
import { authInstance } from './firebase-auth'

import { UserProfile } from "./types"

const useUser = () => {
  const [user, setUser] = useState<UserProfile | undefined>()
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
    const cancelAuthListener = authInstance.onIdTokenChanged(async (user) => {
      if (user) {
        const userData = await mapUserData(user)
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
