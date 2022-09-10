import { useCallback, useContext } from 'react'

import { ModalContext, ModalState } from '../../../containers/modalProvider'

const useModal = () => {
  const [modal, setModal] = useContext(ModalContext)

  const showModal = useCallback((modalProps: Omit<ModalState, 'display'>): void => {
    setModal({ ...modalProps, display: true })
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
  }, [setModal])

  return { showModal, updateModal, closeModal, isVisible: modal?.display }
}

export default useModal