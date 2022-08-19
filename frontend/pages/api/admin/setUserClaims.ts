import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from 'firebase-admin'

import { firebaseAdmin } from '../../../lib/server'
import { validateAdminRequest } from '../../../lib/server'

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  var validRequest = await validateAdminRequest(req, res)

  if (!validRequest) {
    return
  }

  // Get the ID token passed.
  const { uid, role } = JSON.parse(req.body)

  await auth(firebaseAdmin).setCustomUserClaims(uid, {
    [role]: true
  })

  res.status(200).end()
}