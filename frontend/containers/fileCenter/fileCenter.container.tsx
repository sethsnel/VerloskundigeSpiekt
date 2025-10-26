import { FullMetadata } from 'firebase/storage'
import Image from 'next/image'
import { useRef, useState, type JSX } from 'react';
import { BsCloudUpload, BsFileEarmarkPdf } from 'react-icons/bs'
import { RiFileExcel2Line, RiFileWord2Line } from 'react-icons/ri'

import { useFiles } from '../../lib/hooks/files'

import styles from './fileCenter.module.scss'

type FileListItem = {
  name: string
  url: string
  metaData: FullMetadata
}

interface FileCenterProps {
  folderPath: string
  files?: FileListItem[]
  isDeletingFileName?: string
  onFileSelect: (file?: FileDto) => void
  onFileUploaded: (file: File) => void
}

export type FileDto = { name: string, url: string }

const FileCenter = ({ folderPath, files, isDeletingFileName, onFileSelect, onFileUploaded }: FileCenterProps) => {
  const { uploadFileMutation } = useFiles(folderPath)
  const fileInput = useRef<null | HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<undefined | FileDto>()

  const selectFile = (file?: FileDto) => {
    setSelectedFile(file)
    onFileSelect(file)
  }

  const uploadNewFile = async () => {
    if (fileInput.current != null && fileInput.current.files && fileInput.current.files.length > 0) {
      const file = fileInput.current.files[0] as File
      await uploadFileMutation.mutateAsync({ file })
      onFileUploaded(file)
    }
  }

  let fileOptions = undefined
  if (files) {
    fileOptions = files.map(file => {
      const isLoading = isDeletingFileName === file.name
      const isSelected = file.url === selectedFile?.url
      return mapFileToTile(file, isLoading, isSelected, selectFile)
    })

    fileOptions.push(
      uploadFileMutation.isLoading ?
        <div key="fileUploadInput" className={`${styles.uploadFile} d-flex justify-content-center align-items-center`}>
          <div className="spinner-grow" role="status" />
        </div> :
        <div key="fileUploadInput" className={styles.uploadFile}>
          <label htmlFor="profilePicture" className="form-label">
            <BsCloudUpload size={100} color="white" className={styles.icon} />
            <span>Upload</span>
          </label>
          <input type="file" id="profilePicture" accept="image/*,.pdf,.doc, .docx, .csv" ref={fileInput} onChange={uploadNewFile} />
        </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid} onClick={() => selectFile(undefined)}>
        {/* <div className={styles.grid}> */}
        {
          (fileOptions) ? fileOptions : <div className="spinner-grow" role="status" />
        }
      </div>
    </div>
  )
}

function mapFileToTile(file: FileListItem, isLoading: boolean, isSelected: boolean, selectFile: (file?: FileDto) => void): JSX.Element {
  const { contentType } = file.metaData

  return isLoading ?
    <div key={file.name} className={`${styles.uploadFile} d-flex justify-content-center align-items-center`}>
      <div className="spinner-grow" role="status" />
    </div> :
    contentType?.includes('application/') ?
      <div key={file.name} className={`${styles.selectableFile} ${isSelected && styles.selected} `} onClick={(event) => { event.stopPropagation(); selectFile(file) }}>
        {getIconForFile(file.name)}
        <span>{file.name}</span>
      </div> :
      <div key={file.name} className={`${styles.selectableImage} ${isSelected && styles.selected} `} onClick={(event) => { event.stopPropagation(); selectFile(file) }}>
        <Image src={file.url} alt={file.name}
          objectFit='cover' fill={true} blurDataURL={`/_next/image?url=${encodeURI(file.url)}&w=1920&q=10`} placeholder="blur" />
        <span>{file.name}</span>
      </div>
}

function getIconForFile(fileName: string) {
  const extension = fileName.split('.').pop()

  switch (extension) {
    case 'pdf':
      return <BsFileEarmarkPdf size={100} className={styles.icon} />
    case 'csv':
      return <RiFileExcel2Line size={100} className={styles.icon} />
    default:
      return <RiFileWord2Line size={100} className={styles.icon} />
  }
}

export default FileCenter