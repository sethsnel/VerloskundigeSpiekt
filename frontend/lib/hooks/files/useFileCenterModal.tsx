import { useCallback, useEffect, useMemo, useState } from "react"

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
  const files = listFilesQuery.data
  const refetchFiles = listFilesQuery.refetch
  const deleteFile = deleteFileMutation.mutate

  useEffect(() => { if (!modalIsOpen) setSelectedFile(undefined) }, [modalIsOpen])

  const confirmFileSelection = useCallback(() => {
    selectedFile && onFileSelect && onFileSelect(selectedFile.url)
    closeModal()
  }, [closeModal, onFileSelect, selectedFile])

  const onFileUploaded = useCallback(() => {
    refetchFiles()
  }, [refetchFiles])

  const deleteSelectedFile = useCallback(() => {
    if (selectedFile) {
      deleteFile(selectedFile.id)
      setSelectedFile(undefined)
    }
  }, [deleteFile, selectedFile])

  const modalProps: ModalState = useMemo(() => ({
    title: "Kies bestand",
    modalBody: <FileCenter folderPath={folderPath} files={files} onFileSelect={setSelectedFile} onFileUploaded={onFileUploaded} isDeletingFileName={isDeletingFileName} />,
    actions: [
      { label: "Annuleer", type: 'cancel', onClick: closeModal },
      { label: "Verwijder", onClick: deleteSelectedFile, type: 'delete', disabled: !selectedFile },
      { label: "Kies", onClick: confirmFileSelection, type: 'save', disabled: !selectedFile }
    ]
  }), [closeModal, confirmFileSelection, deleteSelectedFile, files, folderPath, isDeletingFileName, onFileUploaded, selectedFile])

  //Update modal when props change
  useEffect(() => {
    if (activeModal === modalKey) {
      updateModal(modalProps)
    }
  }, [activeModal, modalKey, modalProps, updateModal])

  const showFileCenterModal = async () => {
    showModal(modalProps)
  }

  return { showFileCenterModal }
}

export default useFileCenterModal

