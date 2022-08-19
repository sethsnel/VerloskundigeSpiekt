import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from 'firebase-admin'
import { ListUsersResult } from 'firebase-admin/lib/auth/base-auth'
import { UserRecord } from 'firebase-admin/lib/auth/user-record'

import { firebaseAdmin } from '../../../lib/server'
import { validateAdminRequest } from '../../../lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserRecord[]>
) {
  var validRequest = await validateAdminRequest(req, res)

  if (!validRequest) {
    return
  }

  const listAllUsers = async (depth: number = 0, nextPageToken?: string): Promise<ListUsersResult> => {
    const listUsersResult = await auth(firebaseAdmin).listUsers(20, nextPageToken)

    if (listUsersResult.pageToken && depth > 0) {
      return listAllUsers(--depth, listUsersResult.pageToken)
    }

    return listUsersResult
  }

  var fetchedUsers = await listAllUsers()

  res.status(200).json(fetchedUsers.users)
}