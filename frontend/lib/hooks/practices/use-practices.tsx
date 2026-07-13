'use client'

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'

import { UserProfile } from '../../auth/types'
import type { PracticeWithRole } from '../../../schema/practice'
import { generatedApi } from '../../api/generated'
import { apiQueryKeys, clearTenantQueries } from '../../api/query-keys'

type CreatePracticeInput = { name: string; ownerId?: string; ownerEmail?: string | null; ownerName?: string | null; address?: Record<string, string> }
type UpdatePracticeInput = { practiceId: string; name: string; address?: Record<string, string> }

const mapPractice = (practice: { id: string; name: string; role: 'Member' | 'Administrator' | 'Owner'; version: string }): PracticeWithRole => ({
  id: practice.id,
  name: practice.name,
  address: {},
  role: practice.role === 'Member' ? 'user' : 'admin',
  createdAt: null,
  version: practice.version,
})

const usePractices = (user?: UserProfile) => {
  const queryClient = useQueryClient()
  const userId = user?.id
  const previousUserId = useRef(userId)
  useEffect(() => {
    if (previousUserId.current !== userId) { void clearTenantQueries(queryClient); previousUserId.current = userId }
    return () => { void queryClient.cancelQueries({ predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === 'api' }) }
  }, [queryClient, userId])

  const practicesQuery = useQuery(
    apiQueryKeys.practices(userId),
    async () => (await generatedApi.listPractices()).map(mapPractice),
    { enabled: Boolean(userId) }
  )

  const activePracticeQuery = useQuery(
    apiQueryKeys.activePractice(userId),
    async () => {
      const me = await generatedApi.getMe()
      if (!me.activePracticeId) return undefined
      const practices = await generatedApi.listPractices()
      const active = practices.find(practice => practice.id === me.activePracticeId)
      return active ? mapPractice(active) : undefined
    },
    { enabled: Boolean(userId) }
  )

  const invalidatePracticeQueries = () => {
    queryClient.invalidateQueries(apiQueryKeys.practices(userId))
    queryClient.invalidateQueries(apiQueryKeys.activePractice(userId))
  }

  const createPracticeMutation = useMutation(
    async (input: Omit<CreatePracticeInput, 'ownerId' | 'ownerEmail' | 'ownerName'>) => mapPractice(await generatedApi.createPractice(input.name, input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'), crypto.randomUUID())),
    {
      onSuccess: () => {
        invalidatePracticeQueries()
      },
    }
  )

  const setActivePracticeMutation = useMutation(
    async (practiceId: string | null) => {
      const me = await generatedApi.setActivePractice(practiceId)
      if (!me.activePracticeId) return undefined
      const practices = await generatedApi.listPractices()
      const active = practices.find(practice => practice.id === me.activePracticeId)
      return active ? mapPractice(active) : undefined
    },
    {
      onMutate: async () => {
        await clearTenantQueries(queryClient)
      },
      onSuccess: () => {
        void clearTenantQueries(queryClient)
        queryClient.invalidateQueries(apiQueryKeys.activePractice(userId))
      },
    }
  )

  const updatePracticeMutation = useMutation(
    async (input: UpdatePracticeInput) => {
      const version = queryClient.getQueryData<PracticeWithRole[]>(apiQueryKeys.practices(userId))?.find(practice => practice.id === input.practiceId)?.version
      if (!version) throw new Error('The practice version is unavailable; refresh before updating.')
      return mapPractice(await generatedApi.updatePractice(input.practiceId, input.name, input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'), version))
    },
    {
      onSuccess: (updatedPractice) => {
        invalidatePracticeQueries()
        queryClient.invalidateQueries(apiQueryKeys.members(userId, updatedPractice.id))
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
