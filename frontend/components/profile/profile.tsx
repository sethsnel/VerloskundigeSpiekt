'use client'

import Link from 'next/link'

import { useUser } from '../../lib/auth/use-user'
import { Button } from '../button'

import styles from './profile.module.scss'
import ProfilePicture from './profile.picure'

interface ProfileProps {
}

const Profile = (props: ProfileProps) => {
  const { user, logout } = useUser()

  if (!user) {
    return (
      <div className={styles.profile}>
        <Button variant="outline" icon='login'>
          <Link href={`/login`}>
            Aanmelden
          </Link>
        </Button>
      </div >
    )
  }

  return (
    <div className={styles.profile}>
      <ProfilePicture profilePic={user.profilePic ?? undefined} />
      <h3>{user?.name}</h3>
      <Button variant="outline" icon='logout' onClick={() => logout()}>uitloggen</Button>
    </div>
  )
}

export default Profile
