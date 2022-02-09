import { useState } from 'react'

import { Accordion } from '../../components/accordion'
import { Button } from '../../components/button'
import { useUser } from '../../lib/auth/use-user'
import { upsertSubTopic } from '../../lib/firestore/sub-topics'
import SubTopic from '../../schema/sub-topic'

import styles from './sub-topics.module.scss'

interface SubTopicsProps {
  subTopics: SubTopic[]
  topicId: string
}

const SubTopics = (props: SubTopicsProps) => {
  const { user } = useUser()
  const [newSubTopic, setNewSubTopic] = useState<SubTopic | undefined>()
  const initialNewSubTopic = { name: 'Nieuw sub-onderwerp', text: '<h2>Nieuw kopje</h2><p>Nieuwe tekst</p>' }
  const onCancel = () => {
    setNewSubTopic(undefined)
  }

  const accordions = props.subTopics.map(subTopic =>
    <Accordion
      key={subTopic.id}
      name={subTopic.name}
      text={subTopic.text}
      modificationEnabled={!!user}
      onUpdate={(updated) => upsertSubTopic({ ...subTopic, ...updated }, props.topicId)}
    />
  )

  if (newSubTopic) {
    accordions.unshift(<Accordion
      key='new'
      name={newSubTopic.name}
      text={newSubTopic.text}
      editMode={true}
      modificationEnabled={true}
      onCancel={onCancel}
      onUpdate={(updated) => { upsertSubTopic(updated, props.topicId); setNewSubTopic(undefined) }}
    />)
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {
          (newSubTopic || !user) ? undefined :
            <Button icon="add"
              onClick={() => setNewSubTopic(initialNewSubTopic)}>
              Voeg sub-onderwerp toe
            </Button>
        }
      </div>
      <div className={styles.grid}>
        {accordions}
      </div>
    </div>
  )
}

export default SubTopics
