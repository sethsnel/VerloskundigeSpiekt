import { useMutation, useQuery, useQueryClient } from "react-query"

import { generatedApi } from '../../api/generated'
import { apiQueryKeys } from '../../api/query-keys'

const useFiles = (path: string) => {
  const queryClient = useQueryClient()

  const uploadFileMutation = useMutation(
    async ({ file, fileName }: { file: File, fileName?: string }) => {
      const me = await generatedApi.getMe()
      if (!me.activePracticeId) throw new Error('Select a practice before uploading files.')
      const uploadFile = fileName ? new File([file], fileName, { type: file.type }) : file
      const authorization = await generatedApi.authorizeFileUpload(me.activePracticeId, uploadFile)
      await generatedApi.uploadFile(authorization.url, uploadFile)
      return generatedApi.authorizeFileDownload(me.activePracticeId, authorization.file.id).then(async access => generatedApi.downloadFile(access.url))
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(apiQueryKeys.files(undefined, undefined, path))
      }
    }
  )

  const deleteFileMutation = useMutation(
    async (fileId: string) => {
      const me = await generatedApi.getMe()
      if (!me.activePracticeId) throw new Error('Select a practice before deleting files.')
      await generatedApi.deleteFile(me.activePracticeId, fileId)
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(apiQueryKeys.files(undefined, undefined, path))
      }
    }
  )

  const listFilesQuery = useQuery(
    apiQueryKeys.files(undefined, undefined, path),
    async () => {
      const me = await generatedApi.getMe()
      if (!me.activePracticeId) return []
      const files = await generatedApi.listFiles(me.activePracticeId)
      return Promise.all(files.map(async file => {
        const access = await generatedApi.authorizeFileDownload(me.activePracticeId as string, file.id)
        return { id: file.id, name: file.fileName, url: await generatedApi.downloadFile(access.url), contentType: file.contentType, size: file.sizeBytes }
      }))
    }
  )

  return { uploadFileMutation, deleteFileMutation, listFilesQuery }
}

export default useFiles
