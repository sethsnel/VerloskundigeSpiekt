import { useEffect, useState } from "react"

import { FileCenter, FileDto } from "../../../containers/fileCenter"
import { ModalState } from "../../../containers/modalProvider"

import { useModal } from "../utilities"
import useFiles from "./useFiles"

const useFileCenterModal = (folderPath: string, onFileSelect: (url: string) => void) => {
  const modalKey = `file-center-modal-${folderPath}`
  const { showModal, updateModal, closeModal, isVisible: modalIsOpen, activeModal } = useModal(modalKey)
  const { listFilesQuery, deleteFileMutation } = useFiles(folderPath)
  const [selectedFile, setSelectedFile] = useState<undefined | FileDto>(undefined)
  const isDeletingFileName = deleteFileMutation.isLoading ? deleteFileMutation.variables : undefined

  //Reset selectedFile when modal is closed
  if (!modalIsOpen && selectedFile?.name) {
    setSelectedFile(undefined)
  }

  const confirmFileSelection = () => {
    selectedFile && onFileSelect && onFileSelect(selectedFile.url)
    closeModal()
  }

  const onFileUploaded = () => {
    listFilesQuery.refetch()
  }

  const deleteSelectedFile = () => {
    if (selectedFile) {
      deleteFileMutation.mutate(selectedFile.name)
      setSelectedFile(undefined)
    }
  }

  const modalProps: ModalState = {
    title: "Kies bestand",
    modalBody: <FileCenter folderPath={folderPath} files={listFilesQuery.data} onFileSelect={setSelectedFile} onFileUploaded={onFileUploaded} isDeletingFileName={isDeletingFileName} />,
    actions: [
      { label: "Annuleer", type: 'cancel', onClick: closeModal },
      { label: "Verwijder", onClick: deleteSelectedFile, type: 'delete', disabled: !selectedFile },
      { label: "Kies", onClick: confirmFileSelection, type: 'save', disabled: !selectedFile }
    ]
  }

  //Update modal when props change
  useEffect(() => {
    if (activeModal === modalKey) {
      updateModal(modalProps)
    }
  }, [folderPath, listFilesQuery.data?.length, selectedFile?.name, isDeletingFileName, modalIsOpen])

  const showFileCenterModal = async () => {
    showModal(modalProps)
  }

  return { showFileCenterModal }
}

export default useFileCenterModal

