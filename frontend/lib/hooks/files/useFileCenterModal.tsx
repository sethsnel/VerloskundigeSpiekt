import { useEffect, useState } from "react"

import { FileCenter, FileDto } from "../../../containers/fileCenter"
import { ModalState } from "../../../containers/modalProvider"

import { useModal } from "../utilities"
import useFiles from "./useFiles"

const useFileCenterModal = (folderPath: string, onFileSelect: (url: string) => void) => {
  const { showModal, updateModal, closeModal, isVisible: modalIsOpen } = useModal()
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
      { label: "Kies", onClick: confirmFileSelection, type: 'save', disabled: !selectedFile },
      { label: "Verwijder", onClick: deleteSelectedFile, type: 'delete', disabled: !selectedFile },
      { label: "Annuleer", type: 'cancel', onClick: closeModal }
    ]
  }

  const showFileCenterModal = async () => {
    showModal(modalProps)
  }

  //Update modal when props change
  useEffect(() => {
    if (modalIsOpen) {
      updateModal(modalProps)
    }
  }, [folderPath, listFilesQuery.data?.length, selectedFile?.name, isDeletingFileName, modalIsOpen])

  return { showFileCenterModal }
}

export default useFileCenterModal

