import { ModalComponent } from "@/components/modal"
import { createContext, ReactNode, useState } from "react"

import { ModalState } from "."


export const ModalContext = createContext<[ModalState | undefined, React.Dispatch<React.SetStateAction<ModalState | undefined>>]>([undefined, () => { }])

function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | undefined>(undefined)

  return (
    <ModalContext.Provider value={[modal, setModal]}>
      {modal && modal.display ? <ModalComponent /> : undefined}
      {children}
    </ModalContext.Provider>
  )
}

export default ModalProvider