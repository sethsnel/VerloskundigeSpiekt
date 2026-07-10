import admin from 'firebase-admin'

const hasServiceAccount = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
const firebaseAdmin = admin.initializeApp(hasServiceAccount ? {
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
} : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })

export default firebaseAdmin
