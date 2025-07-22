import { useCallback, useContext, useState } from 'react'

import { ModalContext, ModalState } from '../../../containers/modalProvider'

const useModal = (key: string) => {
  const [modal, setModal] = useContext(ModalContext)
  const [modalKey, setModalKey] = useState('')

  const showModal = useCallback((modalProps: Omit<ModalState, 'display'>): void => {
    setModal({ ...modalProps, display: true })
    setModalKey(key)
  }, [setModal])

  const updateModal = useCallback((modalProps: Omit<ModalState, 'display'>): void => {
    if (modal && modal.display) {
      setModal({ ...modalProps, display: true })
    }
    else {
      console.warn('Update Modal should only be called when modal is active/visible. Check useModal.tsx')
    }
  }, [setModal, modal])

  const closeModal = useCallback(() => {
    setModal(undefined)
    setModalKey('')
  }, [setModal])

  return { showModal, updateModal, closeModal, isVisible: modal?.display, activeModal: modalKey }
}

export default useModal