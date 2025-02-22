import { setCookie, getCookie, deleteCookie } from 'cookies-next'

import { UserProfile } from './types'

export const getUserFromCookie = () => {
  return getCookie('auth') as any as UserProfile
}

export const setUserCookie = (user: UserProfile) => {
  setCookie('auth', user, {
    // firebase id tokens expire in one hour
    // set cookie expiry to match
    maxAge: 60 * 60
  })
}

export const removeUserCookie = () => deleteCookie('auth')
