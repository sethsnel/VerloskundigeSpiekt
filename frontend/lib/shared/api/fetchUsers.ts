import { UserRecord } from "firebase-admin/lib/auth/user-record"

export default async function fetchUsers(idToken: string, page?: number): Promise<UserRecord[]> {
  const response = await fetch('/api/admin/users?page=' + page, {
    method: 'GET',
    headers: { 'vs-auth-token': idToken }
  })

  return response.json()
}
