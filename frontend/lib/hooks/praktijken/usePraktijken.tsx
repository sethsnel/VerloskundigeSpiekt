'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import {
  acceptInvite,
  addAddressBookEntry,
  createPraktijk,
  getActivePraktijkId,
  getAddressBookEntries,
  getPendingInvites,
  getPraktijkInvites,
  getPraktijkMembers,
  getUserPraktijken,
  inviteMember,
  setActivePraktijk,
  updatePraktijkAddress,
} from '@/lib/firestore/praktijken'
import {
  getActivePraktijkQueryKey,
  getAddressBookEntriesQueryKey,
  getPendingInvitesQueryKey,
  getPraktijkenQueryKey,
  getPraktijkInvitesQueryKey,
  getPraktijkMembersQueryKey,
} from '@/lib/react-query'
import type { PraktijkAddress, PraktijkAddressBookEntry, PraktijkRole } from '../../../schema/praktijk'

export const usePraktijken = (userId?: string) => {
  return useQuery(
    getPraktijkenQueryKey(userId),
    async () => {
      if (!userId) return []
      return await getUserPraktijken(userId)
    },
    { enabled: Boolean(userId) },
  )
}

export const useActivePraktijk = (userId?: string) => {
  return useQuery(
    getActivePraktijkQueryKey(userId),
    async () => {
      if (!userId) return null
      return await getActivePraktijkId(userId)
    },
    { enabled: Boolean(userId) },
  )
}

export const usePraktijkMembers = (praktijkId?: string) => {
  return useQuery(
    getPraktijkMembersQueryKey(praktijkId),
    async () => {
      if (!praktijkId) return []
      return await getPraktijkMembers(praktijkId)
    },
    { enabled: Boolean(praktijkId) },
  )
}

export const usePraktijkInvites = (praktijkId?: string) => {
  return useQuery(
    getPraktijkInvitesQueryKey(praktijkId),
    async () => {
      if (!praktijkId) return []
      return await getPraktijkInvites(praktijkId)
    },
    { enabled: Boolean(praktijkId) },
  )
}

export const usePendingInvites = (email?: string | null) => {
  return useQuery(
    getPendingInvitesQueryKey(email ?? undefined),
    async () => {
      if (!email) return []
      return await getPendingInvites(email)
    },
    { enabled: Boolean(email) },
  )
}

export const useAddressBookEntries = (praktijkId?: string) => {
  return useQuery(
    getAddressBookEntriesQueryKey(praktijkId),
    async () => {
      if (!praktijkId) return []
      return await getAddressBookEntries(praktijkId)
    },
    { enabled: Boolean(praktijkId) },
  )
}

export const useCreatePraktijk = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async ({
      name,
      address,
      userId,
      userEmail,
    }: {
      name: string
      address: PraktijkAddress
      userId: string
      userEmail: string | null
    }) => {
      return await createPraktijk({ name, address, userId, userEmail })
    },
    {
      onSuccess: async (_, variables) => {
        queryClient.invalidateQueries(getPraktijkenQueryKey(variables.userId))
        queryClient.invalidateQueries(getActivePraktijkQueryKey(variables.userId))
      },
    },
  )
}

export const useSetActivePraktijk = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ userId, praktijkId }: { userId: string; praktijkId: string }) => {
      return await setActivePraktijk(userId, praktijkId)
    },
    {
      onSuccess: async (_, variables) => {
        queryClient.invalidateQueries(getActivePraktijkQueryKey(variables.userId))
      },
    },
  )
}

export const useInviteMember = (praktijkId?: string) => {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ email, role, invitedBy }: { email: string; role: PraktijkRole; invitedBy: string }) => {
      if (!praktijkId) return null
      return await inviteMember({ praktijkId, email, role, invitedBy })
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(getPraktijkInvitesQueryKey(praktijkId))
      },
    },
  )
}

export const useAcceptInvite = (userId?: string) => {
  const queryClient = useQueryClient()

  return useMutation(
    async ({
      praktijkId,
      inviteId,
      userEmail,
      role,
    }: {
      praktijkId: string
      inviteId: string
      userEmail: string | null
      role: PraktijkRole
    }) => {
      if (!userId) return null
      return await acceptInvite({ praktijkId, inviteId, userId, userEmail, role })
    },
    {
      onSuccess: async () => {
        if (userId) {
          queryClient.invalidateQueries(getPraktijkenQueryKey(userId))
          queryClient.invalidateQueries(getActivePraktijkQueryKey(userId))
        }
        queryClient.invalidateQueries(getPendingInvitesQueryKey())
      },
    },
  )
}

export const useAddAddressBookEntry = (praktijkId?: string) => {
  const queryClient = useQueryClient()

  return useMutation(
    async (entry: Omit<PraktijkAddressBookEntry, 'id' | 'createdAt'>) => {
      if (!praktijkId) return null
      return await addAddressBookEntry({ praktijkId, entry })
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(getAddressBookEntriesQueryKey(praktijkId))
      },
    },
  )
}

export const useUpdatePraktijkAddress = (praktijkId?: string, userId?: string) => {
  const queryClient = useQueryClient()

  return useMutation(
    async (address: PraktijkAddress) => {
      if (!praktijkId) return null
      return await updatePraktijkAddress({ praktijkId, address })
    },
    {
      onSuccess: async () => {
        if (userId) {
          queryClient.invalidateQueries(getPraktijkenQueryKey(userId))
        }
      },
    },
  )
}
