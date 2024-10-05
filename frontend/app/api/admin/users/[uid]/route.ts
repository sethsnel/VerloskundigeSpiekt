import { auth } from 'firebase-admin'

import { firebaseAdmin } from '../../../../../lib/server'
import { validateAdminRequest } from '../../../../../lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params: { uid } }: { params: { uid: string } }
) {
  var requestResponseCode = await validateAdminRequest()
  if (requestResponseCode !== 200) {
    return NextResponse.json({}, { status: requestResponseCode })
  }

  var fetchedUser = await auth(firebaseAdmin).getUser(uid)
  return NextResponse.json(fetchedUser)
}