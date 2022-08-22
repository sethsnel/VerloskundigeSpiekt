import { useRef, useState } from "react"

import { useModal } from "../utilities"
import { FileCenter } from "../../../containers/fileCenter"

const useFileCenterModal = (folderPath: string) => {
  const { showModal, closeModal } = useModal()
  const selectedFileUrl = useRef<undefined | string>(undefined)

  const selectFile = async (url: string) => {
    selectedFileUrl.current = url
  }

  const showFileCenterModal = async (onFileSelect: (url: string) => void) => {
    const confirmFileSelection = () => {
      selectedFileUrl.current && onFileSelect && onFileSelect(selectedFileUrl.current)
      closeModal()
    }

    showModal({
      title: "Kies bestand",
      children: <FileCenter folderPath={folderPath} onFileSelect={(url: string) => selectFile(url)} />,
      actions: [
        { label: "Kies", onClick: confirmFileSelection, type: 'save' },
        { label: "Annuleer", type: 'cancel', onClick: closeModal }
      ]
    })
  }

  return { showFileCenterModal }
}

export default useFileCenterModal

