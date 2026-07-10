'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import { UserProfile } from '../../auth/types'
import { generatedApi } from '../../api/generated'
import { apiQueryKeys } from '../../api/query-keys'

type InvitationResponse = { practiceId: string; inviteId: string; response: 'accepted' | 'declined' }

const usePracticeInvites = (user?: UserProfile) => {
  const queryClient = useQueryClient()
  const pendingInvitesQuery = useQuery(
    apiQueryKeys.invitations(user?.id),
    async () => (await generatedApi.listPendingInvitations()).map(invite => ({ id: invite.id, practiceId: invite.practiceId, email: invite.email, role: invite.role === 'Member' ? 'user' as const : 'admin' as const, invitedBy: '', status: invite.status.toLowerCase() as 'pending' | 'accepted' | 'declined' })),
    { enabled: Boolean(user?.email) }
  )

  const respondToInviteMutation = useMutation(
    (input: InvitationResponse) => generatedApi.respondToInvitation(input.inviteId, input.response === 'accepted' ? 'Accept' : 'Decline'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(apiQueryKeys.invitations(user?.id))
        queryClient.invalidateQueries(apiQueryKeys.practices(user?.id))
        queryClient.invalidateQueries(apiQueryKeys.activePractice(user?.id))
      },
    }
  )

  return {
    pendingInvitesQuery,
    respondToInviteMutation,
  }
}

export default usePracticeInvites
