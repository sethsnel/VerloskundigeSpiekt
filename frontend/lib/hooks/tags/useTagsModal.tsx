import { useState } from "react"

import EditTags from "../../../components/tags/edit-tags"
import { ModalState } from "../../../containers/modalProvider"

import { useModal } from "../utilities"
import { Tag, UpsertTag } from "../../../schema/article"

const useTagsModal = (tags: Tag[], onSave: (newTags: UpsertTag[]) => void) => {
  const { showModal, updateModal, closeModal, isVisible: modalIsOpen } = useModal()
  const [newTags, setNewTags] = useState<UpsertTag[]>(tags)
  const onTagSelect = (tag: UpsertTag) => {
    console.info('On tag select', tag)
    console.info(!newTags.map(nt => nt.id).includes(tag.id))
    if (!newTags.map(nt => nt.id).includes(tag.id)) {
      setNewTags([...newTags, tag])
    }
  }

  //Reset tags when modal is closed
  const haveTagsChanged = tags.map(t => t.id).filter(tagId => !newTags.map(nt => nt.id).includes(tagId)).length > 0
  if (!modalIsOpen && haveTagsChanged) {
    setNewTags(tags)
  }

  const saveTags = () => {
    onSave(newTags)
    closeModal()
  }

  const modalProps: ModalState = {
    title: "Beheer tags",
    modalBody: <EditTags tags={newTags} onTagSelect={onTagSelect} />,
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

