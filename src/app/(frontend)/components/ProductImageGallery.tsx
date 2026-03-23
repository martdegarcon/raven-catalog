'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

export function ProductImageGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const safeImages = useMemo(() => images.filter(Boolean), [images])
  const [index, setIndex] = useState(0)
  const startXRef = useRef<number | null>(null)

  useEffect(() => {
    setIndex(0)
  }, [safeImages.length])

  const goPrev = () => {
    if (safeImages.length <= 1) return
    setIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  const goNext = () => {
    if (safeImages.length <= 1) return
    setIndex((prev) => (prev + 1) % safeImages.length)
  }

  const unoptimized = Boolean(safeImages[index]?.includes('/api/media/'))

  const onPointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (startXRef.current == null) return
    const dx = e.clientX - startXRef.current
    startXRef.current = null

    // Порог, чтобы не реагировать на случайные движения
    const threshold = 45
    if (dx > threshold) goPrev()
    if (dx < -threshold) goNext()
  }

  if (safeImages.length === 0) return null

  return (
    <div
      className="product-image-gallery"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="product-image-gallery-media">
        <Image
          src={safeImages[index]}
          alt={alt}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={unoptimized}
        />
      </div>

      {safeImages.length > 1 && (
        <>
          <div className="product-image-gallery-controls" aria-hidden="true">
            <button
              type="button"
              className="product-image-gallery-btn"
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              type="button"
              className="product-image-gallery-btn"
              onClick={goNext}
            >
              ›
            </button>
          </div>

          <div className="product-image-gallery-dots" aria-label="Gallery pagination">
            {safeImages.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`product-image-gallery-dot ${i === index ? 'active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

