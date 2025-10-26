import { auth } from 'firebase-admin'
import { ListUsersResult } from 'firebase-admin/lib/auth/base-auth'

import { firebaseAdmin } from '../../../../lib/server'
import { validateAdminRequest } from '../../../../lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  var requestResponseCode = await validateAdminRequest()
  if (requestResponseCode !== 200) {
    return NextResponse.json([], { status: requestResponseCode })
  }

  const listAllUsers = async (depth: number = 0, nextPageToken?: string): Promise<ListUsersResult> => {
    const listUsersResult = await auth(firebaseAdmin).listUsers(20, nextPageToken)

    if (listUsersResult.pageToken && depth > 0) {
      return listAllUsers(--depth, listUsersResult.pageToken)
    }

    return listUsersResult
  }

  var fetchedUsers = await listAllUsers()
  return NextResponse.json(fetchedUsers.users)
}
