import { UserRole } from "../../auth/types"

export default async function setUserRole(idToken: string, uid: string, role: UserRole): Promise<void> {
  await fetch('/api/admin/setUserClaims', {
    method: 'POST',
    headers: { 'vs-auth-token': idToken },
    body: JSON.stringify({ uid, role })
  })
}
