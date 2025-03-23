import { HTMLProps } from "react"

import { Button } from "../button"
import { useUser } from '../../lib/auth/use-user'
import { useFileCenterModal } from '../../lib/hooks/files'

interface EditBannerProps extends HTMLProps<HTMLButtonElement> {
  articleId: string
  onSave: (newUrl: string) => void
}

export default function EditBanner({ articleId, onSave, className }: EditBannerProps) {
  const { user } = useUser()
  const { showFileCenterModal } = useFileCenterModal(`/articles/${articleId}`, onSave)

  return <>
    {!user?.hasContributeRights() ? undefined : (
      <Button onClick={showFileCenterModal} icon='edit' className={`position-absolute bottom-0 end-0 m-3 btn btn-info ${className}`}>update banner</Button>
    )}
  </>
}