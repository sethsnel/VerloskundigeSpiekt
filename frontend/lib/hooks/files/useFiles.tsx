import { useMutation, useQuery, useQueryClient } from "react-query"

import { listFiles, uploadFile } from '../../firebase/files'
import { deleteFile } from "../../firebase/files/fileService"

const useFiles = (path: string) => {
  const queryClient = useQueryClient()

  const uploadFileMutation = useMutation(
    async ({ file, fileName }: { file: File, fileName?: string }) => {
      const pathAndFileName = fileName ?? `${path.replace(/\/$/, '')}/${file.name}`
      return await uploadFile(pathAndFileName, file)
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['listFiles', path])
      }
    }
  )

  const deleteFileMutation = useMutation(
    async (fileName: string) => {
      await deleteFile(`${path.replace(/\/$/, '')}/${fileName}`)
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['listFiles', path])
      }
    }
  )

  const listFilesQuery = useQuery(
    ['listFiles', path],
    () => listFiles(path)
  )

  return { uploadFileMutation, deleteFileMutation, listFilesQuery }
}

export default useFiles
