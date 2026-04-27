'use client'

import { useRouter } from 'next/navigation'
import { FaHouseChimneyMedical } from "react-icons/fa6"

import { useUser } from '../../lib/auth/use-user'
import { usePractices } from '../../lib/hooks/practices'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select'
import { SidebarGroup, useSidebar } from '../ui/sidebar'

const REGISTER_VALUE = '__register_practice__'

const PracticeSwitcher = () => {
  const { user } = useUser()
  const { state } = useSidebar()
  const router = useRouter()
  const { practicesQuery, activePracticeQuery, setActivePracticeMutation } = usePractices(user)

  if (!user) {
    return undefined
  }

  const activePractice = activePracticeQuery.data
  const practices = practicesQuery.data ?? []

  if (state === 'collapsed') {
    return (
      <SidebarGroup className="px-2">
        <button
          type="button"
          className="hover:bg-sidebar-accent mx-auto flex size-8 items-center justify-center rounded-md"
          title={activePractice?.name ?? 'Praktijk'}
          onClick={() => router.push('/praktijk')}
        >
          <FaHouseChimneyMedical className="size-4" />
        </button>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="px-3 py-2">
      <Select
        value={activePractice?.id ?? ''}
        onValueChange={(value) => {
          if (value === REGISTER_VALUE) {
            setActivePracticeMutation.mutate(null, {
              onSuccess: () => router.push('/praktijk'),
            })
            return
          }
          setActivePracticeMutation.mutate(value)
        }}
      >
        <SelectTrigger aria-label="Selecteer praktijk">
          <SelectValue placeholder="Praktijk" />
        </SelectTrigger>
        <SelectContent>
          {practices.map((practice) => (
            <SelectItem key={practice.id} value={practice.id}>
              {practice.name}
            </SelectItem>
          ))}
          {practices.length > 0 && <SelectSeparator />}
          <SelectItem value={REGISTER_VALUE}>Registreer praktijk</SelectItem>
        </SelectContent>
      </Select>
    </SidebarGroup>
  )
}

export default PracticeSwitcher
