'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from './LanguageProvider'

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? '/'

export function BackToSite() {
  const { t, lang, setLang } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const switchCatalogLang = (nextLang: 'ru' | 'en') => {
    // Сохраняем выбранный язык
    setLang(nextLang)

    // Обновляем query `lang`, чтобы server-компоненты каталога
    // (они читают searchParams) отрендерились сразу правильно.
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', nextLang)

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <header className="catalog-back-to-site">
      <div className="catalog-topbar">
        <Link href={landingUrl} className="catalog-back-to-site-link">
          ← {t('catalog.backToSite')}
        </Link>

        <div className="catalog-lang-toggle" role="group" aria-label="Language toggle">
          <button
            type="button"
            className={`catalog-lang-btn ${lang === 'ru' ? 'active' : ''}`}
            onClick={() => switchCatalogLang('ru')}
          >
            RU
          </button>
          <button
            type="button"
            className={`catalog-lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => switchCatalogLang('en')}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  )
}
