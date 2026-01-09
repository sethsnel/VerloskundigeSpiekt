'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import {
  addPraktijkAddress,
  getPraktijkAddresses,
  getPraktijkInvites,
  getPraktijkMembers,
  invitePraktijkMember,
} from '../../firestore/praktijken'
import { AddPraktijkAddressInput } from '../../firestore/praktijken/add-praktijk-address'
import { InvitePraktijkMemberInput } from '../../firestore/praktijken/invite-praktijk-member'
import {
  getPraktijkAddressesQueryKey,
  getPraktijkInvitesQueryKey,
  getPraktijkMembersQueryKey,
} from '../../react-query'

const usePraktijkResources = (praktijkId?: string) => {
  const queryClient = useQueryClient()

  const membersQuery = useQuery(
    getPraktijkMembersQueryKey(praktijkId),
    () => getPraktijkMembers(praktijkId as string),
    { enabled: Boolean(praktijkId) }
  )

  const invitesQuery = useQuery(
    getPraktijkInvitesQueryKey(praktijkId),
    () => getPraktijkInvites(praktijkId as string),
    { enabled: Boolean(praktijkId) }
  )

  const addressesQuery = useQuery(
    getPraktijkAddressesQueryKey(praktijkId),
    () => getPraktijkAddresses(praktijkId as string),
    { enabled: Boolean(praktijkId) }
  )

  const inviteMutation = useMutation(
    (input: InvitePraktijkMemberInput) => invitePraktijkMember(input),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPraktijkInvitesQueryKey(praktijkId))
      },
    }
  )

  const addAddressMutation = useMutation(
    (input: AddPraktijkAddressInput) => addPraktijkAddress(input),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPraktijkAddressesQueryKey(praktijkId))
      },
    }
  )

  return {
    membersQuery,
    invitesQuery,
    addressesQuery,
    inviteMutation,
    addAddressMutation,
  }
}

export default usePraktijkResources
