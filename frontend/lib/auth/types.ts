export interface UserProfile {
  id: string
  email: string | null
  name: string | null
  profilePic: string | null
  role: UserRole | null
  idToken: string | null
  hasContributeRights: () => boolean
  hasAdminRights: () => boolean
}

export type UserRole = 'admin' | 'contributor' | 'reader'