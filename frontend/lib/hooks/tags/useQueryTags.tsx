'use client'
import { useQuery } from "react-query"
import { getTags } from "../../firestore/tags"

const useQueryTags = (filterTagIds?: string[]) => {
  const queryTags = useQuery(
    ['tags', ...filterTagIds || []],
    async () => {
      return await getTags(filterTagIds)
    }
  )

  return { queryTags }
}

export default useQueryTags

