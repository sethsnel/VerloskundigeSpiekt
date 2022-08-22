import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { GrCloudUpload } from 'react-icons/gr'

import { useFileCenter } from '../../lib/hooks/utilities'
import styles from './fileCenter.module.scss'

interface FileCenterProps {
  folderPath: string
  onFileSelect: (url: string) => Promise<void>
}

type FileDto = { name: string, url: string }

const FileCenter = ({ folderPath, onFileSelect }: FileCenterProps) => {
  const { uploadFile, listFiles } = useFileCenter()
  const fileInput = useRef<null | HTMLInputElement>(null)
  const [fileList, setFileList] = useState<undefined | FileDto[]>()
  const [selectedFile, setSelectedFile] = useState<undefined | FileDto>()
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false)

  const fetchFiles = async () => {
    const files = await listFiles(folderPath)
    setFileList(files)
  }

  const selectFile = (file: FileDto) => {
    setSelectedFile(file)
    onFileSelect(file.url)
  }

  const uploadNewFile = async () => {
    if (fileInput.current != null && fileInput.current.files && fileInput.current.files.length > 0) {
      setIsUploadingFile(true)
      const file = fileInput.current.files[0] as File
      const fileName = `${folderPath}/${file.name}`
      await uploadFile(fileName, file)
      await fetchFiles()
      setIsUploadingFile(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [folderPath])

  let fileOptions = undefined
  if (fileList) {
    fileOptions = fileList.map(file => (
      <div key={file.name} className={`${styles.selectableImage} ${file === selectedFile && styles.selected} `} onClick={() => selectFile(file)}>
        <Image src={file.url} alt={file.name} objectFit='cover' layout='fill' />
        <span>{file.name}</span>
      </div>
    ))

    fileOptions.push(
      isUploadingFile ?
        <div key="fileUploadInput" className={`${styles.uploadFile} d-flex justify-content-center align-items-center`}>
          <div className="spinner-grow" role="status" />
        </div> :
        <div key="fileUploadInput" className={styles.uploadFile}>
          <label htmlFor="profilePicture" className="form-label">
            <GrCloudUpload size={150} />
            <span>Nieuw bestand</span>
          </label>
          <input type="file" id="profilePicture" accept="image/*" ref={fileInput} onChange={() => uploadNewFile()} />
        </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {
          (fileOptions) ? fileOptions : <div className="spinner-grow" role="status" />
        }
      </div>
    </div>
  )
}

export default FileCenter
