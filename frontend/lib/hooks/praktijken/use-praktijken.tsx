'use client'

import { useMutation, useQuery, useQueryClient } from 'react-query'

import {
  createPraktijk,
  getActivePraktijk,
  getPraktijkenForUser,
  setActivePraktijk,
} from '../../firestore/praktijken'
import { CreatePraktijkInput } from '../../firestore/praktijken/create-praktijk'
import { getActivePraktijkQueryKey, getPraktijkenQueryKey } from '../../react-query'

const usePraktijken = (userId?: string) => {
  const queryClient = useQueryClient()

  const praktijkenQuery = useQuery(
    getPraktijkenQueryKey(userId),
    () => getPraktijkenForUser(userId as string),
    { enabled: Boolean(userId) }
  )

  const activePraktijkQuery = useQuery(
    getActivePraktijkQueryKey(userId),
    () => getActivePraktijk(userId as string),
    { enabled: Boolean(userId) }
  )

  const createPraktijkMutation = useMutation(
    (input: CreatePraktijkInput) => createPraktijk(input),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getPraktijkenQueryKey(userId))
        queryClient.invalidateQueries(getActivePraktijkQueryKey(userId))
      },
    }
  )

  const setActivePraktijkMutation = useMutation(
    (praktijkId: string) => setActivePraktijk(userId as string, praktijkId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(getActivePraktijkQueryKey(userId))
      },
    }
  )

  return {
    praktijkenQuery,
    activePraktijkQuery,
    createPraktijkMutation,
    setActivePraktijkMutation,
  }
}

export default usePraktijken
