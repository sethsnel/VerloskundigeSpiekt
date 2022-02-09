import { User } from "firebase/auth"

import { UserProfile } from "./types"

export const mapUserData = (user: User): UserProfile => {
    const { uid, email, displayName, photoURL } = user
    return {
        id: uid,
        email,
        name: displayName,
        profilePic: photoURL
    }
}
