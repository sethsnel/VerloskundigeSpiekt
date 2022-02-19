import fs from 'fs'

export function findFreeFileName(path: string, extension: string, iteration?: number): string {
  try {
    const fileName = getFileName(path, extension, iteration)
    if (fs.existsSync(fileName)) {
      return findFreeFileName(path, extension, (iteration) ? iteration + 1 : 1)
    }

    return fileName
  } catch (err) {
    console.error(err)
    return ''
  }
}

function getFileName(path: string, extension: string, iteration?: number): string {
  if (iteration) {
    return `${path}-${iteration}.${extension}`
  }

  return `${path}.${extension}`
}