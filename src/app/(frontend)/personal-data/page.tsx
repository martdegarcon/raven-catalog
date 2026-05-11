import Link from 'next/link'
import { TranslatedText } from '../components/TranslatedText'

interface PersonalDataPageProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function PersonalDataPage({ searchParams }: PersonalDataPageProps) {
  const sp = await searchParams
  const lang = sp.lang === 'en' ? 'en' : 'ru'

  return (
    <div className="catalog">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link href={`/?lang=${lang}`} className="back-link">
          ← <TranslatedText translationKey="catalog.backToCatalog" />
        </Link>

        <h1 style={{ marginTop: 0 }}>
          <TranslatedText translationKey="policy.personalData.title" as="span" />
        </h1>

        <p style={{ color: 'var(--base-secondary-dark)', opacity: 0.9, whiteSpace: 'pre-line' }}>
          <TranslatedText translationKey="policy.personalData.content" as="span" />
        </p>
      </div>
    </div>
  )
}

