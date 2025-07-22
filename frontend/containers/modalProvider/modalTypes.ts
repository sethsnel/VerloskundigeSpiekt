import { ReactNode } from "react"

type actionType = 'edit' | 'save' | 'add' | 'delete' | 'cancel'

export type ModalState = {
  title?: string
  description?: string
  modalBody?: ReactNode
  modalFooter?: ReactNode
  display?: boolean
  actions?: { type: actionType, label: string, disabled?: boolean, onClick?: () => void }[]
  onClose?: () => void
}