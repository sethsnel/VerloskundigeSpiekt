'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import { UserProfile } from '../../auth/types'
import {
  createPractice,
  getActivePractice,
  getPracticesForUser,
  setActivePractice,
  updatePractice,
} from '../../firestore/practices'
import { CreatePracticeInput } from '../../firestore/practices/create-practice'
import { UpdatePracticeInput } from '../../firestore/practices/update-practice'
import {
  getActivePracticeQueryKey,
  getPracticeMembersQueryKey,
  getPracticesQueryKey,
} from '../../react-query'

const usePractices = (user?: UserProfile) => {
  const queryClient = useQueryClient()
  const userId = user?.id

  const practicesQuery = useQuery(
    getPracticesQueryKey(userId),
    () => getPracticesForUser(userId as string),
    { enabled: Boolean(userId) }
  )

  const activePracticeQuery = useQuery(
    getActivePracticeQueryKey(userId),
    () => getActivePractice(userId as string),
    { enabled: Boolean(userId) }
  )

  const invalidatePracticeQueries = () => {
    queryClient.invalidateQueries(getPracticesQueryKey(userId))
    queryClient.invalidateQueries(getActivePracticeQueryKey(userId))
  }

  const createPracticeMutation = useMutation(
    (input: Omit<CreatePracticeInput, 'ownerId' | 'ownerEmail' | 'ownerName'>) => createPractice({
      ...input,
      ownerId: userId as string,
      ownerEmail: user?.email,
      ownerName: user?.name,
    }),
    {
      onSuccess: () => {
        invalidatePracticeQueries()
      },
    }
  )

  const setActivePracticeMutation = useMutation(
    (practiceId: string | null) => setActivePractice(userId as string, practiceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getActivePracticeQueryKey(userId))
      },
    }
  )

  const updatePracticeMutation = useMutation(
    (input: UpdatePracticeInput) => updatePractice(input),
    {
      onSuccess: (updatedPractice) => {
        invalidatePracticeQueries()
        queryClient.invalidateQueries(getPracticeMembersQueryKey(updatedPractice.practiceId))
      },
    }
  )

  return {
    practicesQuery,
    activePracticeQuery,
    createPracticeMutation,
    setActivePracticeMutation,
    updatePracticeMutation,
  }
}

export default usePractices
