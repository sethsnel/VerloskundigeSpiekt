import { useState } from "react"

import EditTags from "../../../components/tags/edit-tags"
import { ModalState } from "../../../containers/modalProvider"

import { useModal } from "../utilities"
import { Tag, UpsertTag } from "../../../schema/article"

const useTagsModal = (tags: Tag[], onSave: (newTags: UpsertTag[]) => void) => {
  const modalKey = `tags-modal`
  const { showModal, closeModal, isVisible: modalIsOpen } = useModal(modalKey)
  const [newTags, setNewTags] = useState<UpsertTag[]>(tags)
  const onTagAdd = (tag: UpsertTag) => {
    if (!newTags.map(nt => nt.name).includes(tag.name)) {
      setNewTags([...newTags, tag])
    }
  }
  const onTagRemove = (tag: UpsertTag) => {
    const tagIndex = newTags.map(nt => nt.name).indexOf(tag.name)
    if (tagIndex > -1) {
      newTags.splice(tagIndex, 1)
      setNewTags([...newTags])
    }
  }

  //Reset tags when modal is closed
  const newTagNames = newTags.map(nt => nt.name)
  const existingTagNames = tags.map(nt => nt.name)
  const haveTagsChanged = existingTagNames
    .filter(x => !newTagNames.includes(x))
    .concat(newTagNames.filter(x => !existingTagNames.includes(x))).length > 0
  if (!modalIsOpen && haveTagsChanged) {
    setNewTags(tags)
  }

  const saveTags = (tags: UpsertTag[]) => {
    onSave(tags)
    closeModal()
  }

  const modalProps: ModalState = {
    title: "Beheer tags",
    modalBody: <EditTags articleTags={newTags} onTagAdd={onTagAdd} onTagRemove={onTagRemove} saveTags={saveTags} closeModal={closeModal} />,
    actions: []
  }

  const showTagsModal = async () => {
    showModal(modalProps)
  }

  return { showTagsModal }
}

export default useTagsModal

