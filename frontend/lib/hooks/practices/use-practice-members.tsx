'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import {
  createPracticeInvite,
  getPracticeInvites,
  getPracticeMembers,
  removePracticeMember,
  transferPracticeOwnership,
  updatePracticeMemberRole,
} from '../../firestore/practices'
import { CreatePracticeInviteInput } from '../../firestore/practices/create-practice-invite'
import { RemovePracticeMemberInput } from '../../firestore/practices/remove-practice-member'
import { TransferPracticeOwnershipInput } from '../../firestore/practices/transfer-practice-ownership'
import { UpdatePracticeMemberRoleInput } from '../../firestore/practices/update-practice-member-role'
import {
  getActivePracticeQueryKey,
  getPracticeInvitesForPracticeQueryKey,
  getPracticeInvitesQueryKey,
  getPracticeMembersQueryKey,
  getPracticesQueryKey,
} from '../../react-query'

const usePracticeMembers = (practiceId?: string, userId?: string, canViewInvites = false) => {
  const queryClient = useQueryClient()

  const membersQuery = useQuery(
    getPracticeMembersQueryKey(practiceId),
    () => getPracticeMembers(practiceId as string),
    { enabled: Boolean(practiceId) }
  )

  const invitesQuery = useQuery(
    getPracticeInvitesForPracticeQueryKey(practiceId),
    () => getPracticeInvites(practiceId as string),
    { enabled: Boolean(practiceId && canViewInvites) }
  )

  const createInviteMutation = useMutation(
    (input: Omit<CreatePracticeInviteInput, 'practiceId' | 'invitedBy'>) => createPracticeInvite({
      ...input,
      practiceId: practiceId as string,
      invitedBy: userId as string,
    }),
    {
      onSuccess: (invite) => {
        queryClient.invalidateQueries(getPracticeInvitesQueryKey(invite.email))
        queryClient.invalidateQueries(getPracticeInvitesForPracticeQueryKey(practiceId))
      },
    }
  )

  const updateMemberRoleMutation = useMutation(
    (input: Omit<UpdatePracticeMemberRoleInput, 'practiceId'>) => updatePracticeMemberRole({
      ...input,
      practiceId: practiceId as string,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPracticeMembersQueryKey(practiceId))
        queryClient.invalidateQueries(getPracticesQueryKey(userId))
      },
    }
  )

  const removeMemberMutation = useMutation(
    (input: Omit<RemovePracticeMemberInput, 'practiceId'>) => removePracticeMember({
      ...input,
      practiceId: practiceId as string,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPracticeMembersQueryKey(practiceId))
        queryClient.invalidateQueries(getPracticesQueryKey(userId))
      },
    }
  )

  const transferOwnershipMutation = useMutation(
    (input: Omit<TransferPracticeOwnershipInput, 'practiceId'>) => transferPracticeOwnership({
      ...input,
      practiceId: practiceId as string,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPracticeMembersQueryKey(practiceId))
        queryClient.invalidateQueries(getPracticesQueryKey(userId))
        queryClient.invalidateQueries(getActivePracticeQueryKey(userId))
      },
    }
  )

  return {
    membersQuery,
    invitesQuery,
    createInviteMutation,
    removeMemberMutation,
    transferOwnershipMutation,
    updateMemberRoleMutation,
  }
}

export default usePracticeMembers
