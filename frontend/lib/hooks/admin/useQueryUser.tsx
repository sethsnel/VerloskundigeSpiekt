import { useQuery } from "react-query"
import { useUser } from "../../auth/use-user"
import { fetchUser } from "../../shared/api"

const useQueryUser = (uid: string) => {
  const { user } = useUser()

  const userResult = useQuery(
    ['getUser', user?.idToken, uid],
    () => fetchUser(user?.idToken ?? '', uid),
    {
      enabled: uid !== undefined && user?.idToken !== undefined
    }
  )

  return { userResult }
}

export default useQueryUser