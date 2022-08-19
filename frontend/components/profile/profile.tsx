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
        <Button icon='login'>
          <Link href={`/login`}>
            <a>Aanmelden</a>
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.profile}>
      <ProfilePicture profilePic={user.profilePic ?? undefined} />
      <h3>{user?.name}</h3>
      <Button icon='logout' onClick={() => logout()}>uitloggen</Button>
    </div>
  )
}

export default Profile
