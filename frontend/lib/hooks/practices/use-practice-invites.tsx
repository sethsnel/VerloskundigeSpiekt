'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import { UserProfile } from '../../auth/types'
import { getPendingPracticeInvites, respondToPracticeInvite } from '../../firestore/practices'
import { RespondToPracticeInviteInput } from '../../firestore/practices/respond-to-practice-invite'
import {
  getActivePracticeQueryKey,
  getPracticeInvitesQueryKey,
  getPracticesQueryKey,
} from '../../react-query'

const usePracticeInvites = (user?: UserProfile) => {
  const queryClient = useQueryClient()
  const email = user?.email

  const pendingInvitesQuery = useQuery(
    getPracticeInvitesQueryKey(email),
    () => getPendingPracticeInvites(email as string),
    { enabled: Boolean(email) }
  )

  const respondToInviteMutation = useMutation(
    (input: Pick<RespondToPracticeInviteInput, 'practiceId' | 'inviteId' | 'response'>) => respondToPracticeInvite({
      ...input,
      userId: user?.id as string,
      email: user?.email,
      displayName: user?.name,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPracticeInvitesQueryKey(email))
        queryClient.invalidateQueries(getPracticesQueryKey(user?.id))
        queryClient.invalidateQueries(getActivePracticeQueryKey(user?.id))
      },
    }
  )

  return {
    pendingInvitesQuery,
    respondToInviteMutation,
  }
}

export default usePracticeInvites
