import type { UserRecord } from "firebase-admin/auth"

export default async function fetchUser(idToken: string, uid: string): Promise<UserRecord> {
  const response = await fetch('/api/admin/users/' + uid, {
    method: 'GET',
    headers: { 'vs-auth-token': idToken }
  })

  return response.json()
}
