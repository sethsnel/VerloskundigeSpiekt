const { initializeApp, backups } = require('firestore-export-import')
const fs = require('fs')

const serviceAccount = require('./verloskundigespiekt-prod.json')

// Initiate Firebase App
initializeApp(serviceAccount)

// Export options
const options = {
  docsFromEachCollection: 100,
}

backups(['topics', 'sub-topics'], options).then((data: any) =>
  fs.writeFileSync('export.json', JSON.stringify(data))
)

export {}
