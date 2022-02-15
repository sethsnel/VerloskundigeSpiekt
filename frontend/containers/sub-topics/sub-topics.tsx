import { useEffect, useState } from 'react'

import { Accordion } from '../../components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertSubTopic, deleteSubTopic } from '../../lib/firestore/sub-topics'
import SubTopic from '../../schema/sub-topic'

import styles from './sub-topics.module.scss'

interface SubTopicsProps {
  subTopics: SubTopic[]
  topicId: string
}

const SubTopics = (props: SubTopicsProps) => {
  const { user } = useUser()
  const [subTopics, setSubTopics] = useState<SubTopic[]>(props.subTopics)
  const [newSubTopic, setNewSubTopic] = useState<SubTopic | undefined>()

  useEffect(() => {
    setSubTopics(props.subTopics)
  }, [props.subTopics])

  const initialNewSubTopic = {
    name: 'Nieuw sub-onderwerp',
    text: '<h2>Nieuw kopje</h2><p>Nieuwe tekst</p>',
  }
  const onCancel = () => {
    setNewSubTopic(undefined)
  }
  const removeSubTopicFromState = (subTopicId: string) => {
    setSubTopics(subTopics.filter((st) => st.id !== subTopicId))
  }
  const addSubTopicToState = (subTopic: SubTopic) => {
    setSubTopics([subTopic, ...subTopics])
  }
  const updateSubTopicInState = (subTopic: SubTopic) => {
    const index = subTopics.findIndex((st) => st.id === subTopic.id)
    subTopics[index] = subTopic
    setSubTopics(subTopics)
  }

  const accordions = subTopics
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((subTopic) => (
      <Accordion
        key={subTopic.id}
        name={subTopic.name}
        text={subTopic.text}
        modificationEnabled={!!user}
        onUpdate={(updated) => {
          const updatedSubTopic = { ...subTopic, ...updated }
          upsertSubTopic(updatedSubTopic, props.topicId)
          updateSubTopicInState(updatedSubTopic)
        }}
        onDelete={() => {
          deleteSubTopic(subTopic)
          removeSubTopicFromState(subTopic.id || '')
        }}
      />
    ))

  if (newSubTopic) {
    accordions.unshift(
      <Accordion
        key="new"
        name={newSubTopic.name}
        text={newSubTopic.text}
        editMode={true}
        modificationEnabled={true}
        onCancel={onCancel}
        onUpdate={async (updated) => {
          const subTopicId = await upsertSubTopic(updated, props.topicId)
          addSubTopicToState({ id: subTopicId, ...updated })
          setNewSubTopic(undefined)
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {newSubTopic || !user ? undefined : (
          <Button icon="add" onClick={() => setNewSubTopic(initialNewSubTopic)}>
            Voeg sub-onderwerp toe
          </Button>
        )}
      </div>
      <div className={styles.grid}>{accordions}</div>
    </div>
  )
}

export default SubTopics
