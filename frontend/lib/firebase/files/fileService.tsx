import { getDownloadURL, getStorage, listAll, ref, uploadBytes, deleteObject, getMetadata } from "firebase/storage"

import firebaseApp from "../../../config/firebaseConfig"

export const uploadFile = async (path: string, file: File): Promise<string> => {
  const storageInstance = getStorage(firebaseApp)
  const imagesRef = ref(storageInstance, path)

  const uploadTask = await uploadBytes(imagesRef, file)
  return await getDownloadURL(uploadTask.ref)
}

export const deleteFile = async (path: string) => {
  if (path.endsWith('/')) {
    console.error('Do not delete complete folder with `deleteFile` function in fileService.tsx')
    return
  }

  const storageInstance = getStorage(firebaseApp)
  const objectRef = ref(storageInstance, path)
  await deleteObject(objectRef)
}

export const listFiles = async (path: string) => {
  const storageInstance = getStorage(firebaseApp)
  const folderRef = ref(storageInstance, path)

  const files = await listAll(folderRef)
  return await Promise.all(files.items.map(async file => ({
    name: file.name,
    url: await getDownloadURL(file),
    metaData: await getMetadata(file),
  })))
}
