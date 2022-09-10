import dynamic from "next/dynamic"
import { createContext, ReactNode, useState } from "react"

import { ModalState } from "."

//@ts-ignore
const Modal: typeof ModalComponent = dynamic(() => import('../../components/modal').then((mod) => mod.ModalComponent), {
  ssr: false,
})

export const ModalContext = createContext<[ModalState | undefined, React.Dispatch<React.SetStateAction<ModalState | undefined>>]>([undefined, () => { }])

function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | undefined>(undefined)

  return (
    <ModalContext.Provider value={[modal, setModal]}>
      {modal && modal.display ? <Modal /> : undefined}
      {children}
    </ModalContext.Provider>
  )
}

export default ModalProvider