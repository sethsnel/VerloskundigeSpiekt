import { ParsedToken, User } from "firebase/auth"

import { UserProfile, UserRole } from "./types"

export const mapUserData = async (user: User): Promise<UserProfile> => {
    const { uid, email, displayName, photoURL } = user
    var idToken = await user.getIdTokenResult()

    const role = mapClaimsToUserRole(idToken.claims)

    return {
        id: uid,
        email,
        name: displayName,
        profilePic: photoURL,
        role,
        idToken: idToken.token,
        hasAdminRights: () => ['admin'].includes(role),
        hasContributeRights: () => ['admin', 'contributor'].includes(role)
    }
}

export function mapClaimsToUserRole(claims: ParsedToken | { [key: string]: any }): UserRole {
    if (claims.admin) {
        return 'admin'
    }
    else if (claims.contributor) {
        return 'contributor'
    }

    return 'reader'
}
