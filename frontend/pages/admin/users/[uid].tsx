import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { NextPage } from "next/types"

import { DefaultLayout } from "../../../components/layout"
import { mapClaimsToUserRole } from "../../../lib/auth/map-user-data"
import { useQueryUser } from "../../../lib/hooks/admin"
import { setUserRole } from "../../../lib/shared/api"
import { useUser } from "../../../lib/auth/use-user"
import { UserRecord } from "firebase-admin/lib/auth/user-record"
import { UserRole } from "../../../lib/auth/types"
import { Button } from "../../../components/button"
import { ProfilePicture } from "../../../components/profile"
import { Toast } from '../../../components/toast'

import styles from '../../../styles/User.module.scss'

//@ts-ignore
const ToastComp: ComponentType<typeof Toast> = dynamic(() => import('../../../components/toast').then((mod) => mod.Toast), {
  ssr: false,
})

const UserPage: NextPage = () => {
  const { query } = useRouter()
  const { userResult } = useQueryUser(query.uid as string)
  const [newUserRole, setNewUserRole] = useState<UserRole>('reader')
  const [show, setShow] = useState(false)

  let userInfo: UserRecord | undefined = undefined
  let userRole: UserRole | undefined = undefined

  if (userResult.isSuccess) {
    userInfo = userResult.data
    userRole = mapClaimsToUserRole(userInfo.customClaims ?? {})
  }

  useEffect(() => {
    if (userResult.isSuccess) {
      setNewUserRole(userRole as UserRole)
    }
  }, [userResult.isSuccess, userRole])

  const { user } = useUser()
  const updateUserRole = async () => {
    await setUserRole(user?.idToken ?? '', query.uid as string, newUserRole)
    userResult.refetch()
    setShow(true)
  }

  return (
    <DefaultLayout>
      <ToastComp message="Succesvol aangepast" show={show} />
      {userResult.isSuccess ?
        <div className={styles.container}>
          <div className={styles.center}><Link href={`/admin/users`}><a>terug naar overzicht</a></Link></div>
          <div className={styles.center}><ProfilePicture profilePic={userInfo?.photoURL ?? undefined} size={90} /></div>
          <div className="row">
            <div className="col-sm-4">Naam:</div>
            <div className="col-sm-8">{userInfo?.displayName}</div>
          </div>
          <div className="row">
            <div className="col-sm-4">E-mail:</div>
            <div className="col-sm-8">{userInfo?.email}</div>
          </div>
          <div className="row">
            <div className="col-sm-4">Rol:</div>
            <div className="col-sm-8">{userRole}</div>
          </div>
          <div className="row">
            <div className="col-sm-4">Nieuwe rol:</div>
            <div className="col-sm-8">
              <select className="form-select" value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}>
                <option>reader</option>
                <option>contributor</option>
                <option>admin</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-4"></div>
            <div className="col-sm-8">
              <Button onClick={updateUserRole} icon='save'>Update rol</Button>
            </div>
          </div>
        </div> :
        userResult.isError ?
          <div>Probleem opgetreden, ben je ingelogd?</div> :
          <div className="d-flex justify-content-center">
            <div className="spinner-grow" role="status" />
          </div>
      }
    </DefaultLayout >
  )
}

export default UserPage