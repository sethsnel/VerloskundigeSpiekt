import { useState } from "react"

import EditTags from "../../../components/tags/edit-tags"
import { ModalState } from "../../../containers/modalProvider"

import { useModal } from "../utilities"

const useTagsModal = (tags: string[], onSave: (newTags: string[]) => void) => {
  const { showModal, updateModal, closeModal, isVisible: modalIsOpen } = useModal()
  const [newTags, setNewTags] = useState<string[]>(tags)
  const onTagSelect = (tag: string) => {
    console.info('On tag select', tag)
    if (!newTags.includes(tag)) {
      setNewTags([...newTags, tag])
    }
  }

  //Reset selectedFile when modal is closed
  if (!modalIsOpen && tags !== newTags) {
    setNewTags(tags)
  }

  const saveTags = () => {
    onSave(tags)
    closeModal()
  }

  const modalProps: ModalState = {
    title: "Beheer tags",
    modalBody: <EditTags tags={tags} allTags={['avond eten']} onTagSelect={onTagSelect} />,
    actions: [
      { label: "Opslaan", onClick: saveTags, type: 'save', disabled: tags === newTags },
      { label: "Annuleer", type: 'cancel', onClick: closeModal }
    ]
  }

  const showTagsModal = async () => {
    showModal(modalProps)
  }

  //Update modal when props change
  //updateModal(modalProps)

  return { showTagsModal }
}

export default useTagsModal

