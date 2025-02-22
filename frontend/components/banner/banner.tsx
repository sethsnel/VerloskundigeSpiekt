import Image from 'next/image'

import EditBanner from './edit-banner'

interface EditableBannerProps {
  url?: string
  articleId: string
  onSave: (newUrl: string) => void
}

export default function EditableBanner({ url, articleId, onSave }: EditableBannerProps) {
  if (url) {
    return <div className='position-relative w-100' style={{ minHeight: '60vh' }}>
      <Image src={url} alt='Banner illustration of article' fill={true} style={{ objectFit: 'cover' }} loading="eager" priority={true} />
      <EditBanner articleId={articleId} onSave={onSave} />
    </div>
  }

  return <div className='position-relative w-100' style={{ minHeight: '3em' }}>
    <EditBanner articleId={articleId} onSave={onSave} />
  </div>
}