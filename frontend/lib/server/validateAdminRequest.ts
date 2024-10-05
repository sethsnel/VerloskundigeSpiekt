import { auth } from "firebase-admin"
import { headers } from 'next/headers'

import { firebaseAdmin } from "."

export default async function validateAdminRequest(): Promise<number> {
  const headersList = headers()
  const idToken = headersList.get('vs-auth-token')

  if (idToken === undefined || !idToken || typeof idToken === 'undefined') {
    return 401
  }

  try {
    const decodedToken = await auth(firebaseAdmin).verifyIdToken(idToken as string)

    if (!decodedToken.admin) {
      return 403
    }
  }
  catch (error: any) {
    if (error.codePrefix === 'auth') {
      return 401
    }
    else {
      return 500
    }
  }

  return 200
}