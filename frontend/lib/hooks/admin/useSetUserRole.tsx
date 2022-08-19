import { useQuery } from "react-query"
import { useUser } from "../../auth/use-user"
import { fetchUsers } from "../../shared/api"

const useAdminUsers = (page?: number) => {
  const { user } = useUser()

  const usersResult = useQuery(
    ['getUsers', user?.idToken, page],
    () => fetchUsers(user?.idToken ?? '', page ?? 0),
    {
      enabled: user?.idToken !== undefined
    }
  )

  return { usersResult }
}

export default useAdminUsers