'use client'

import Link from 'next/link'
import { AiOutlineLogout } from 'react-icons/ai'

import { useUser } from '../../lib/auth/use-user'
import { Button } from '../button'

import ProfilePicture from './profile.picure'
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

const Profile = () => {
  const { user, logout } = useUser()
  const { state } = useSidebar()

  const containerClassName = 'flex flex-col items-center mt-2'

  if (!user) {
    return (
      <SidebarGroup className={containerClassName}>
        <Button variant="outline" icon='login'>
          <Link href={`/login`}>
            Aanmelden
          </Link>
        </Button>
      </SidebarGroup>
    )
  }

  return (
    <>
      <SidebarGroup className={containerClassName}>
        <ProfilePicture profilePic={user.profilePic ?? undefined} />
        {
          (state !== 'collapsed') && <h3>{user?.name}</h3>
        }
      </SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem title='Uitloggen'>
          <SidebarMenuButton onClick={() => logout()} className='max-w-9/10 m-auto' tooltip={'Uitloggen'}>
            <AiOutlineLogout />
            <span>Uitloggen</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}

export default Profile
