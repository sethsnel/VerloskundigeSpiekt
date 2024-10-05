'use client'
import Link from 'next/link'
import { Fragment } from 'react'

import { mapClaimsToUserRole } from "../../lib/auth/map-user-data"
import { useQueryUsers } from "../../lib/hooks/admin"
import { ProfilePicture } from '../../components/profile'

import styles from './users.module.scss'

const Users = () => {
  const { usersResult } = useQueryUsers()

  if (usersResult.data) {
    var userList = usersResult.data.map(userData => {
      const role = mapClaimsToUserRole(userData.customClaims ?? {})
      return (
        <Fragment key={userData.uid}>
          <div><ProfilePicture profilePic={userData.photoURL ?? undefined} size={50} /></div>
          <div>{userData.displayName}</div>
          <div>{userData.email}</div>
          <div><Link href={`/admin/users/${userData.uid}`}>{role}</Link></div>
        </Fragment>
      )
    })

    return <div className={styles.grid}>
      <div>Profiel</div>
      <div>Naam</div>
      <div>Emailadres</div>
      <div>Rol</div>
      {userList}
    </div>
  }
  else if (usersResult.isError) {
    return <div>Er is een fout opgetreden: {JSON.stringify(usersResult.error)}</div>
  }
  else {
    return <div className="d-flex justify-content-center">
      <div className="spinner-grow" role="status" />
    </div>
  }
}

export default Users