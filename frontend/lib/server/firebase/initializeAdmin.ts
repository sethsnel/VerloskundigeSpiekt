import { cert, initializeApp } from 'firebase-admin/app'

const hasServiceAccount = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
const firebaseAdmin = initializeApp(hasServiceAccount ? {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
} : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })

export default firebaseAdmin
