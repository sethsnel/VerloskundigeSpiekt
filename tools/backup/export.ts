import { initializeApp, backups } from 'firestore-export-import'
import { findFreeFileName } from './utils'
//import dateFormat from 'dateformat'
//const dateFormat = require('dateformat')
import fs from 'fs'

const serviceAccount = require('./verloskundigespiekt-prod.json')

// Initiate Firebase App
initializeApp(serviceAccount)

// Export options
const options = {
  docsFromEachCollection: 200,
}

//const today = dateFormat(Date.now(), 'dd-mm-yyyy')
const collectionsToBackup = ['topics', 'sub-topics']

backups(collectionsToBackup, options).then((data: any) =>
  fs.writeFileSync(findFreeFileName(`export`, 'json'), JSON.stringify(data))
)

export { }