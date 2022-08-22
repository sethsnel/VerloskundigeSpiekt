import { getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage"

import firebaseApp from "../../../config/firebaseConfig"

const useFileCenter = () => {
  const uploadFile = async (path: string, file: File): Promise<string> => {
    const storageInstance = getStorage(firebaseApp)
    const imagesRef = ref(storageInstance, path)

    const uploadTask = await uploadBytes(imagesRef, file)
    return await getDownloadURL(uploadTask.ref)
  }

  const listFiles = async (path: string) => {
    const storageInstance = getStorage(firebaseApp)
    const folderRef = ref(storageInstance, path)

    const files = await listAll(folderRef)
    return await Promise.all(files.items.map(async file => ({
      name: file.name,
      url: await getDownloadURL(file)
    })))
  }

  return { uploadFile, listFiles }
}

export default useFileCenter
