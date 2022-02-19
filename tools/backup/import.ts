import { initializeApp, restore } from 'firestore-export-import'
const serviceAccount = require('./verloskundigespiekt-dev.json')

// Initiate Firebase App
initializeApp(serviceAccount)

restore('topics-to-pages-migration.json')

export { }
