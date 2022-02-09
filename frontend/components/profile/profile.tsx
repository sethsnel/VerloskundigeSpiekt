import Image from 'next/image'
import Link from 'next/link'

import { useUser } from '../../lib/auth/use-user'
import { Button } from '../button'

import styles from './profile.module.scss'

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
      {user?.profilePic ? <Image src={user.profilePic} height={75} width={75} alt="profiel foto" className={styles.picture} /> : undefined}
      <h3>{user?.name}</h3>
      <Button icon='logout' onClick={() => logout()}>uitloggen</Button>
    </div>
  )
}

export default Profile
