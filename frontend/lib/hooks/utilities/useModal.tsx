import dynamic from 'next/dynamic'
import { createContext, useContext } from 'react'

import { ModalComponent, ModalProps } from '../../../components/modal'

//@ts-ignore
const Modal: typeof ModalComponent = dynamic(() => import('../../../components/modal').then((mod) => mod.ModalComponent), {
  ssr: false,
})

export const ModalContext = createContext<[JSX.Element | undefined, React.Dispatch<React.SetStateAction<JSX.Element | undefined>>]>([undefined, () => { }])

const useModal = () => {
  const [modal, setModal] = useContext(ModalContext)

  const showModal = (modalProps: Omit<ModalProps, 'onClose'>): void => {
    setModal(<Modal {...modalProps} onClose={() => setModal(undefined)}>{modalProps.children}</Modal>)
  }

  const closeModal = () => {
    setModal(undefined)
  }

  return { showModal, closeModal }
}

export default useModal