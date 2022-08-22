
import { ReactNode, useCallback, useEffect, useRef } from "react"
import { Modal } from "bootstrap"
import { Button } from "../button"

type actionType = 'edit' | 'save' | 'add' | 'delete' | 'cancel'

export type ModalProps = {
  title?: string
  children?: ReactNode
  display?: boolean
  actions?: { type: actionType, label: string, onClick?: () => void }[]
  onClose?: () => void
}

const ModalComponent = ({ title, children, actions, onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)

  const onModalClose = useCallback(() => {
    modalRef.current && (modalRef.current as HTMLElement).removeEventListener('hidden.bs.modal', onModalClose)
    onClose && onClose()
  }, [onClose])

  useEffect(() => {
    let modalElement = modalRef.current as HTMLElement
    new Modal(modalElement).show()
    modalElement.addEventListener('hidden.bs.modal', onModalClose)
    modalElement = modalRef.current as HTMLElement

    return function cleanup() {
      if (modalElement) {
        //@ts-ignore
        Modal.getInstance(modalElement).hide()
      }
    }
  }, [])

  let actionButtons: JSX.Element[] = []
  if (actions) {
    actionButtons = actions.map(action => (
      <Button key={action.label} icon={action.type} onClick={() => { action.onClick && action.onClick() }}>
        {action.label}
      </Button>
    ))
  }

  return <div className="modal" tabIndex={-1} ref={modalRef} id="bootstrap-modal">
    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {
          actionButtons.length > 0 && <div className="modal-footer">
            {actionButtons}
          </div>
        }
      </div>
    </div>
  </div>
}

export default ModalComponent