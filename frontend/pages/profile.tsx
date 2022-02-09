import styles from '../styles/Home.module.scss'

import { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'

import { useUser } from '../lib/auth/use-user'

const Profile: NextPage = () => {
  const { user, logout } = useUser()

  return (
    <div>
      <Head>
        <title className={styles.title}>Verloskundige spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <h1>Je bent ingelogd!</h1>
      <div>
        <h1>{user?.name}</h1>
        <h3>{user?.email}</h3>
        {user?.profilePic ? <Image src={user.profilePic} height={50} width={50} alt="profiel foto" /> : <p>No profile pic</p>}
        {/* <WriteToCloudFirestore />
        <ReadDataFromCloudFirestore /> */}
        <button onClick={() => logout()}>Log Out</button>
      </div>

    </div>
  )
}

export default Profile
