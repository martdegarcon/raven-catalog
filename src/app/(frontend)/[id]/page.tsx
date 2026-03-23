import { getPayload } from 'payload'
import Link from 'next/link'
import type { Product, Media, Category } from '@/payload-types'
import config from '@/payload.config'
import { OrderForm } from '../components/OrderForm'
import { TranslatedText } from '../components/TranslatedText'
import { CategoryBadge } from '../components/CategoryBadge'
import { ProductImageGallery } from '../components/ProductImageGallery'
import '../styles.css'

interface ProductPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lang?: string }>
}

// Функция для получения локализованного поля
function getLocalizedField<T extends Record<string, any>>(
  doc: T,
  fieldName: string,
  lang: 'ru' | 'en' = 'ru'
): string {
  const localizedField = `${fieldName}_${lang}` as keyof T
  const fallbackField = `${fieldName}_ru` as keyof T
  // Если запрашиваем английский, но его нет - возвращаем русский
  // Если запрашиваем русский, но его нет - возвращаем пустую строку
  if (lang === 'en') {
    return (doc[localizedField] as string) || (doc[fallbackField] as string) || ''
  }
  return (doc[localizedField] as string) || ''
}

// Функция для получения локализованной цены
function getLocalizedPrice(
  product: Product,
  lang: 'ru' | 'en'
): { price: number; currency: string; symbol: string } {
  if (lang === 'en') {
    return {
      price: (product.price_en as number) || (product.price_ru as number) || 0,
      currency: 'EUR',
      symbol: '€'
    }
  }
  return {
    price: (product.price_ru as number) || 0,
    currency: 'RUB',
    symbol: '₽'
  }
}

async function getMediaUrl(value: number | Media | null | undefined, payload: any): Promise<string | null> {
  if (!value) return null

  if (typeof value === 'number') {
    try {
      const media = await payload.findByID({
        collection: 'media',
        id: value,
        depth: 0,
      })
      return media?.url || media?.thumbnailURL || null
    } catch {
      return null
    }
  }

  return value?.url || value?.thumbnailURL || null
}

async function getProductImageUrls(product: Product, payload: any): Promise<string[]> {
  const gallery = (product as any).images as Array<number | Media> | undefined
  const urls: string[] = []

  if (Array.isArray(gallery) && gallery.length > 0) {
    const resolved = await Promise.all(gallery.map((item) => getMediaUrl(item, payload)))
    for (const u of resolved) {
      if (u) urls.push(u)
    }
  } else {
    const main = await getMediaUrl((product as any).image as number | Media, payload)
    if (main) urls.push(main)
  }

  return urls
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params
  const searchParamsResolved = await searchParams
  const lang = (searchParamsResolved.lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'
  
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let product: Product | null = null
  let imageUrls: string[] = []
  let soundUrl: string | null = null

  try {
    product = await payload.findByID({
      collection: 'products',
      id: parseInt(id, 10),
      depth: 1,
    })

    if (product) {
      imageUrls = await getProductImageUrls(product, payload)
      soundUrl = await getMediaUrl((product as any).sound as number | Media | undefined, payload)
    }
  } catch (error) {
    console.error('Error fetching product:', error)
  }

  if (!product) {
    return (
      <div className="catalog">
        <div className="catalog-empty">
          <TranslatedText translationKey="product.notFound" as="p" />
          <Link href="/" style={{ marginTop: '20px', display: 'inline-block' }}>
            <TranslatedText translationKey="catalog.backToCatalog" />
          </Link>
        </div>
      </div>
    )
  }

  const imageUrl = imageUrls[0] ?? null
  const category = typeof product.category === 'object' 
    ? product.category 
    : null

  // Получаем локализованные поля
  const productTitle = getLocalizedField(product, 'title', lang)
  const productDescription = getLocalizedField(product, 'description', lang)
  const categoryName = category ? getLocalizedField(category, 'name', lang) : null
  const { price, symbol } = getLocalizedPrice(product, lang)

  return (
    <div className="catalog">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href={`/?lang=${lang}`} className="back-link">
          ← <TranslatedText translationKey="catalog.backToCatalog" />
        </Link>

        <div className="product-detail-grid">
          {/* Изображение */}
          <div className="product-detail-image">
            {imageUrls.length ? (
              <ProductImageGallery images={imageUrls} alt={productTitle} />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                fontFamily: '"Inter", monospace'
              }}>
                <TranslatedText translationKey="catalog.noImage" />
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="product-detail-info">
            <div>
              <div style={{ 
                marginBottom: '12px',
                padding: '6px 12px',
                background: 'var(--base-100)',
                borderRadius: '4px',
                display: 'inline-block',
                fontSize: '12px',
                color: 'var(--base-secondary-dark)',
                textTransform: 'uppercase',
                fontFamily: '"Inter", monospace',
                letterSpacing: '0.04em',
                opacity: 0.7
              }}>
                <CategoryBadge name={categoryName} />
              </div>
              <h1 style={{ 
                margin: '0 0 16px 0',
                fontSize: '48px',
                lineHeight: '1.1',
                fontWeight: 900,
                textTransform: 'uppercase',
                fontFamily: '"Inter", sans-serif',
                letterSpacing: '-0.03em',
                color: 'var(--base-300)'
              }}>
                {productTitle}
              </h1>
              <div style={{ 
                fontSize: '32px',
                fontWeight: 900,
                color: 'var(--base-300)',
                fontFamily: '"Inter", sans-serif'
              }}>
                {price} {symbol}
              </div>
            </div>

            {productDescription && (
              <div style={{ 
                padding: '24px',
                background: 'var(--base-200)',
                borderRadius: '8px',
                border: '1px solid var(--base-secondary-fade)'
              }}>
                <h3 style={{ 
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  fontFamily: '"Inter", sans-serif',
                  color: 'var(--base-300)'
                }}>
                  <TranslatedText translationKey="catalog.description" />
                </h3>
                <p style={{ 
                  margin: 0,
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: 'var(--base-secondary-dark)',
                  opacity: 0.9,
                  whiteSpace: 'pre-line',
                }}>
                  {productDescription}
                </p>
              </div>
            )}

            {Array.isArray(product.customFields) && product.customFields.length > 0 && (
              <div style={{ 
                padding: '24px',
                background: 'var(--base-200)',
                borderRadius: '8px',
                border: '1px solid var(--base-secondary-fade)',
                marginTop: '24px'
              }}>
                <h3 style={{ 
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  fontFamily: '"Inter", sans-serif',
                  color: 'var(--base-300)'
                }}>
                  <TranslatedText translationKey="product.additionalSpecs" />
                </h3>
                <dl style={{ margin: 0, display: 'grid', gap: '8px' }}>
                  {product.customFields.map((field, i) => {
                    const fieldType = field.type ?? 'text'
                    if (fieldType === 'select') return null
                    const label = (lang === 'en' && field.label_en) ? field.label_en : (field.label_ru ?? '')
                    const linkUrl = field.type === 'link' ? (field.linkUrl ?? '') : ''
                    const linkText = field.type === 'link'
                      ? (lang === 'en' && field.linkText_en) ? field.linkText_en : (field.linkText_ru ?? (linkUrl || ''))
                      : ''
                    const value = fieldType === 'checkbox'
                      ? (field.valueCheckbox ? (lang === 'en' ? 'Yes' : 'Да') : (lang === 'en' ? 'No' : 'Нет'))
                      : fieldType === 'link'
                        ? null
                        : (lang === 'en' && field.value_en != null) ? field.value_en : (field.value_ru ?? '')
                    if (!label) return null
                    return (
                      <div key={field.id ?? `cf-${i}`} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <dt style={{ margin: 0, fontWeight: 600, color: 'var(--base-secondary-dark)', minWidth: '120px' }}>
                          {label}:
                        </dt>
                        <dd style={{ margin: 0, color: 'var(--base-300)' }}>
                          {fieldType === 'link' && linkUrl ? (
                            <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--base-primary)', textDecoration: 'underline' }}>
                              {linkText || linkUrl}
                            </a>
                          ) : (
                            value
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            )}

            {soundUrl && (
              <div style={{
                padding: '24px',
                background: 'var(--base-200)',
                borderRadius: '8px',
                border: '1px solid var(--base-secondary-fade)',
                marginTop: '24px',
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  fontFamily: '"Inter", sans-serif',
                  color: 'var(--base-300)'
                }}>
                  <TranslatedText translationKey="product.soundTitle" />
                </h3>
                <audio controls src={soundUrl} style={{ width: '100%' }} />
              </div>
            )}

            {/* Форма заявки */}
            <OrderForm
              productId={product.id}
              productTitle={productTitle}
              selectFields={
                product.customFields?.filter(
                  (f): f is typeof f & { options: NonNullable<typeof f.options> } =>
                    f?.type === 'select' && Array.isArray(f.options) && f.options.length > 0
                ) ?? []
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
