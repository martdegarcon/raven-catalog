'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

export function ProductImageSlider({
  images,
  alt,
  intervalMs = 2200,
}: {
  images: string[]
  alt: string
  intervalMs?: number
}) {
  const safeImages = useMemo(() => images.filter(Boolean), [images])
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!hovered) return
    if (safeImages.length <= 1) return

    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeImages.length)
    }, intervalMs)

    return () => clearInterval(t)
  }, [hovered, safeImages.length, intervalMs])

  useEffect(() => {
    if (!hovered) setIndex(0)
  }, [hovered])

  const src = safeImages[index] ?? safeImages[0]
  const unoptimized = Boolean(src?.includes('/api/media/'))

  return (
    <div
      className="product-image"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={unoptimized}
        />
      ) : null}
    </div>
  )
}

