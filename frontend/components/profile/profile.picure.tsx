import Image from 'next/image'

import styles from './profile.module.scss'

type ProfilePictureProps = {
  profilePic?: string,
  size?: number
}

const ProfilePicture = ({ profilePic, size = 75 }: ProfilePictureProps) => {
  if (profilePic) {
    return <Image src={profilePic} height={size} width={size} alt="profiel foto" className={styles.picture} loading="eager" priority={true} />
  }
  else {
    return <div></div>
  }
}

export default ProfilePicture