'use client'
import { useCallback, useContext, useRef } from "react"

import { ModalContext } from "../../containers/modalProvider"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { Button } from "../button"

const ModalComponent = () => {
  const [modalState, setModalState] = useContext(ModalContext)
  const { title, description, modalBody: children, actions, display, onClose } = modalState || {}

  const onModalClose = useCallback(() => {
    setModalState({ display: false })
    onClose && onClose()
  }, [onClose, setModalState])

  let actionButtons: JSX.Element[] = []
  if (actions) {
    actionButtons = actions.map(action => (
      <Button variant="outline" key={action.label} icon={action.type} disabled={action.disabled} onClick={() => { action.onClick && action.onClick() }}>
        {action.label}
      </Button>
    ))
  }

  return <Dialog open={display} onOpenChange={onModalClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      {children}
      {actionButtons.length > 0 &&
        (<DialogFooter>
          {actionButtons}
        </DialogFooter>)
      }
    </DialogContent>
  </Dialog>
}

export default ModalComponent