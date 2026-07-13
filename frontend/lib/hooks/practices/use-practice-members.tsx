'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import { generatedApi } from '../../api/generated'
import { apiQueryKeys } from '../../api/query-keys'
type CreatePracticeInviteInput = { practiceId: string; email: string; role: 'admin' | 'user'; invitedBy: string }
type RemovePracticeMemberInput = { practiceId: string; userId: string }
type TransferPracticeOwnershipInput = { practiceId: string; newOwnerId: string }
type UpdatePracticeMemberRoleInput = { practiceId: string; userId: string; role: 'admin' | 'user' }

const apiRole = (role: 'admin' | 'user') => role === 'admin' ? 'Administrator' as const : 'Member' as const

const usePracticeMembers = (practiceId?: string, userId?: string, canViewInvites = false) => {
  const queryClient = useQueryClient()

  const membersQuery = useQuery(
    apiQueryKeys.members(userId, practiceId),
    async () => (await generatedApi.listMembers(practiceId as string)).map(member => ({ id: member.userId, practiceId: practiceId as string, userId: member.userId, role: member.role === 'Member' ? 'user' as const : 'admin' as const, email: member.email, displayName: member.displayName, version: member.version })),
    { enabled: Boolean(practiceId) }
  )

  const invitesQuery = useQuery(
    apiQueryKeys.invitations(userId, practiceId),
    async () => (await generatedApi.listPracticeInvitations(practiceId as string)).map(invite => ({ id: invite.id, practiceId: invite.practiceId, email: invite.email, role: invite.role === 'Member' ? 'user' as const : 'admin' as const, invitedBy: '', status: invite.status.toLowerCase() as 'pending' | 'accepted' | 'declined' })),
    { enabled: Boolean(practiceId && canViewInvites) }
  )

  const createInviteMutation = useMutation(
    (input: Omit<CreatePracticeInviteInput, 'practiceId' | 'invitedBy'>) => generatedApi.invite(practiceId as string, input.email, apiRole(input.role)),
    {
      onSuccess: (invite) => {
        queryClient.invalidateQueries(apiQueryKeys.invitations(userId, practiceId))
      },
    }
  )

  const updateMemberRoleMutation = useMutation(
    (input: Omit<UpdatePracticeMemberRoleInput, 'practiceId'>) => {
      const version = membersQuery.data?.find(member => member.userId === input.userId)?.version
      if (!version) throw new Error('The member version is unavailable; refresh before updating.')
      return generatedApi.updateMember(practiceId as string, input.userId, apiRole(input.role), version)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(apiQueryKeys.members(userId, practiceId))
        queryClient.invalidateQueries(apiQueryKeys.practices(userId))
      },
    }
  )

  const removeMemberMutation = useMutation(
    (input: Omit<RemovePracticeMemberInput, 'practiceId'>) => generatedApi.removeMember(practiceId as string, input.userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(apiQueryKeys.members(userId, practiceId))
        queryClient.invalidateQueries(apiQueryKeys.practices(userId))
      },
    }
  )

  const transferOwnershipMutation = useMutation(
    (input: Omit<TransferPracticeOwnershipInput, 'practiceId'>) => generatedApi.transferOwnership(practiceId as string, input.newOwnerId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(apiQueryKeys.members(userId, practiceId))
        queryClient.invalidateQueries(apiQueryKeys.practices(userId))
        queryClient.invalidateQueries(apiQueryKeys.activePractice(userId))
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
