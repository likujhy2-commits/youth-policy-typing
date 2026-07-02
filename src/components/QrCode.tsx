import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrCode({ url, size = 180 }: { url: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(url, { width: size, margin: 1, color: { dark: '#0a0a1a', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''))
  }, [url, size])

  if (!dataUrl) return null
  return <img src={dataUrl} width={size} height={size} alt="신청 페이지 QR코드" className="rounded-lg" />
}
