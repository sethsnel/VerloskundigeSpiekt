
import { useCallback, useContext, useEffect, useRef } from "react"
import { Modal } from "bootstrap"

import { ModalContext } from "../../containers/modalProvider"

import styles from './modal.module.scss'
import { Button } from "../button"

const ModalComponent = () => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [modalState, setModalState] = useContext(ModalContext)
  const { title, modalBody: children, actions, display, onClose } = modalState || {}

  const onModalClose = useCallback(() => {
    setModalState({ display: false })
    onClose && onClose()
  }, [onClose, setModalState])

  useEffect(() => {
    let modalElement = modalRef.current as HTMLElement
    new Modal(modalElement).show()
    modalElement.addEventListener('hidden.bs.modal', onModalClose)

    return function cleanup() {
      modalElement.removeEventListener('hidden.bs.modal', onModalClose)
      Modal.getInstance(modalElement)?.hide()
    }
  }, [onModalClose, display])

  let actionButtons: JSX.Element[] = []
  if (actions) {
    actionButtons = actions.map(action => (
      <Button variant="outline" key={action.label} icon={action.type} disabled={action.disabled} onClick={() => { action.onClick && action.onClick() }}>
        {action.label}
      </Button>
    ))
  }

  return <div className="modal" tabIndex={-1} ref={modalRef} id="bootstrap-modal">
    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div className={`modal-content ${styles.modalContent}`}>
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