import EditUser from './edit-user'

const UserPage = ({ params: { uid } }: { params: { uid: string } }) => {
  return (
    <EditUser uid={uid} />
  )
}

export default UserPage
