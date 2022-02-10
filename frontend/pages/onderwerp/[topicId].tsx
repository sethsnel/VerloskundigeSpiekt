import type { GetStaticPropsContext, NextPage } from 'next'

import { SubTopics } from '../../containers/sub-topics'
import SubTopic from '../../schema/sub-topic'
import { getTopic, getTopics } from '../../lib/firestore/topics'
import Topic from '../../schema/topic'

import { getSubTopics } from '../../lib/firestore/sub-topics'
import fetchLayoutProps from '../../lib/shared/fetchLayoutProps'
import { DefaultLayout, DefaultLayoutProps } from '../../components/layout'

import styles from '../../styles/Topic.module.scss'

interface TopicPageProps {
  topic: Topic
  subTopics: SubTopic[]
  layoutProps: DefaultLayoutProps
}

type TopicPageParams = {
  topicId: string
}

const TopicPage: NextPage<TopicPageProps> = (props) => {
  return (
    <DefaultLayout {...props.layoutProps}>
      <div className={styles.container}>
        <h1 className={styles.title}>{props.topic.name}</h1>

        <main className={styles.main}>
          <SubTopics subTopics={props.subTopics} topicId={props.topic.id} />
        </main>
      </div>
    </DefaultLayout>
  )
}

export async function getStaticProps({ params }: GetStaticPropsContext<TopicPageParams>) {
  const layoutProps = await fetchLayoutProps()
  const topic = await getTopic(params?.topicId || '')
  const subTopics = await getSubTopics(params?.topicId || '')

  return {
    props: {
      topic,
      subTopics,
      layoutProps
    },
    revalidate: 10
  }
}

export async function getStaticPaths() {
  const topics = await getTopics()

  return {
    paths: topics.map(t => ({ params: { topicId: t.id } })),
    fallback: 'blocking'
  }
}

export default TopicPage
