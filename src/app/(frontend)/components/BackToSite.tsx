'use client'

import Link from 'next/link'
import { useLanguage } from './LanguageProvider'

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? '/'

export function BackToSite() {
  const { t } = useLanguage()

  return (
    <header className="catalog-back-to-site">
      <Link href={landingUrl} className="catalog-back-to-site-link">
        ← {t('catalog.backToSite')}
      </Link>
    </header>
  )
}
