import { auth } from 'firebase-admin'

import { firebaseAdmin } from '../../../../lib/server'
import { validateAdminRequest } from '../../../../lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest
) {
  var requestResponseCode = await validateAdminRequest()
  if (requestResponseCode !== 200) {
    return NextResponse.json({}, { status: requestResponseCode })
  }

  // Get the ID token passed.
  const { uid, role } = await req.json()

  await auth(firebaseAdmin).setCustomUserClaims(uid, {
    [role]: true
  })

  return NextResponse.json({}, { status: 200 })
}