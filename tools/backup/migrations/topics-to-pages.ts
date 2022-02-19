import { initializeApp, backups } from 'firestore-export-import'
import { findFreeFileName } from '../utils'
//import dateformat from 'dateformat'
import fs from 'fs'

const serviceAccount = require('../verloskundigespiekt-prod.json')

// Initiate Firebase App
initializeApp(serviceAccount)

// Export options
const options = {
  docsFromEachCollection: 300,
}

//const today = dateformat(Date.now, 'dd-mm-yyyy')
const collectionsToMigrate = ['topics', 'sub-topics']

backups(collectionsToMigrate, options).then((data: any) => {
  const migrated = transformDate(data)
  fs.writeFileSync(findFreeFileName(`topics-to-pages-migration`, 'json'), JSON.stringify(migrated))
})

function transformDate(data: any): any {
  const { topics, "sub-topics": subTopics } = data
  const pages: any = {}

  for (const [id, topic] of Object.entries(topics)) {
    const oldTopic = topic as any
    if ('subCollection' in oldTopic) {
      const notes: any = {}
      const subTopicIds = Object.keys(oldTopic.subCollection[`topics/${id}/children`])
      subTopicIds.forEach(subTopicId => {
        if (subTopics[subTopicId]) {
          notes[subTopicId] = {
            id: subTopicId,
            name: subTopics[subTopicId].name,
            text: subTopics[subTopicId].text
          }
        } else {
          console.warn(`missing ${subTopicId}`)
        }
      })

      pages[id] = {
        name: oldTopic.name,
        notes
      }
    }
  }

  return pages
}

export { }