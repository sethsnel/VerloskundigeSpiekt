import { auth } from "firebase-admin"
import { NextApiRequest, NextApiResponse } from "next"

import { firebaseAdmin } from "."

export default async function validateAdminRequest(
  req: NextApiRequest,
  res: NextApiResponse): Promise<boolean> {
  const idToken = req.headers['vs-auth-token']

  if (idToken === undefined || !idToken || typeof idToken === 'undefined') {
    res.status(401).end()
    return false
  }

  try {
    const decodedToken = await auth(firebaseAdmin).verifyIdToken(idToken as string)

    if (!decodedToken.admin) {
      res.status(403).end()
      return false
    }
  }
  catch (error: any) {
    if (error.codePrefix === 'auth') {
      res.status(401).end()
      return false
    }
    else {
      res.status(500).end()
      return false
    }
  }

  return true
}