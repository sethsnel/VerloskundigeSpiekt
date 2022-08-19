import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from 'firebase-admin'
import { UserRecord } from 'firebase-admin/lib/auth/user-record'

import { firebaseAdmin } from '../../../../lib/server'
import { validateAdminRequest } from '../../../../lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserRecord>
) {
  var validRequest = await validateAdminRequest(req, res)

  if (!validRequest) {
    return
  }

  var fetchedUser = await auth(firebaseAdmin).getUser(req.query['uid'] as string)

  res.status(200).json(fetchedUser)
}