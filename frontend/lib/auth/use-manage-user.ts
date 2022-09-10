import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import firebase from 'firebase/app'
import 'firebase/auth'

import { useFiles } from '../hooks/files'
import { mapUserData } from './map-user-data'
import { authInstance } from './firebase-auth'
import { updateProfile, User } from 'firebase/auth'

import { UserProfile } from "./types"

const useManageUser = (user?: UserProfile) => {
  const { uploadFileMutation } = useFiles('profilePictures')

  const uploadAndUpdateProfile = async (file: File) => {
    const fileName = `profilePictures/${user?.id}.${file.name.split('.').pop()}`
    const profileUrl = await uploadFileMutation.mutateAsync({ file, fileName })
    await updateProfile(authInstance.currentUser as User, {
      photoURL: profileUrl,
    })
    //setUser(await mapUserData(authInstance.currentUser as User))
  }

  const uploadAndUpdateProfileByUrl = async (profileUrl: string) => {
    await updateProfile(authInstance.currentUser as User, {
      photoURL: profileUrl,
    })
    //setUser(await mapUserData(authInstance.currentUser as User))
  }

  return { user, uploadAndUpdateProfile, uploadAndUpdateProfileByUrl }
}

export { useManageUser }
