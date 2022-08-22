import { NextPage } from 'next'
import Head from 'next/head'
import { useRef } from 'react'

import { useUser } from '../lib/auth/use-user'
import styles from '../styles/User.module.scss'
import { ProfilePicture } from '../components/profile'
import { useFileCenterModal } from '../lib/hooks/fileCenterModal'

const Profile: NextPage = () => {
  const { user, uploadAndUpdateProfile, uploadAndUpdateProfileByUrl, logout } = useUser()
  const imageInput = useRef<null | HTMLInputElement>(null)
  const { showFileCenterModal } = useFileCenterModal('/profilePictures')

  const updateProfilePicture = async () => {
    if (imageInput.current != null && imageInput.current.files && imageInput.current.files.length > 0) {
      await uploadAndUpdateProfile(imageInput.current.files[0])
    }
  }

  const updateProfilePictureByUrl = async (url: string) => {
    await uploadAndUpdateProfileByUrl(url)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title className={styles.title}>Verloskundige Spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <h1>Je bent ingelogd!</h1>
      <button onClick={() => showFileCenterModal(updateProfilePictureByUrl)}>kies afbeelding</button>
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

export default Profile
