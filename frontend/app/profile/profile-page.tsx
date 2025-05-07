'use client'
import { useRef } from 'react'

import { useUser } from '../../lib/auth/use-user'
import styles from '../../styles/User.module.scss'
import { ProfilePicture } from '../../components/profile'
import { useFileCenterModal } from '../../lib/hooks/files'
import { useManageUser } from '../../lib/auth/use-manage-user'

const ProfilePage = () => {
  const { user, logout } = useUser()
  const { uploadAndUpdateProfile, uploadAndUpdateProfileByUrl } = useManageUser(user)
  const imageInput = useRef<null | HTMLInputElement>(null)
  const { showFileCenterModal } = useFileCenterModal('/profilePictures', uploadAndUpdateProfileByUrl)

  const updateProfilePicture = async () => {
    if (imageInput.current != null && imageInput.current.files && imageInput.current.files.length > 0) {
      await uploadAndUpdateProfile(imageInput.current.files[0])
    }
  }

  // const updateProfilePictureByUrl = async (url: string) => {
  //   await uploadAndUpdateProfileByUrl(url)
  // }

  return (
    <div className={styles.container}>
      <h1>Je bent ingelogd!</h1>
      <button onClick={showFileCenterModal}>kies afbeelding</button>
      <div>
        <h1>{user?.name}</h1>
        <h3>{user?.email}</h3>
        <ProfilePicture profilePic={user?.profilePic ?? undefined} />
        {/* <WriteToCloudFirestore />
        <ReadDataFromCloudFirestore /> */}
      </div>

      <div>
        <div className="mb-3">
          <label htmlFor="profilePicture" className="form-label">Default file input example</label>
          <input className="form-control" type="file" id="profilePicture" accept="image/*" ref={imageInput} />
        </div>
        <button onClick={updateProfilePicture}>Upload</button>
      </div>

      <div>
        <button onClick={() => logout()}>Log Out</button>
      </div>

    </div>
  )
}

export default ProfilePage
