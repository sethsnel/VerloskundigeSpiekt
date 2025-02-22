import { Suspense } from 'react'

import EditUser from './edit-user'

async function LoadUserPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params

  return <EditUser uid={uid} />
}

const UserPage = async ({ params }: { params: Promise<{ uid: string }> }) => {
  return (
    <Suspense fallback={<div>Gebruiker laden</div>}>
      <LoadUserPage params={params} />
    </Suspense>
  )
}

export default UserPage
