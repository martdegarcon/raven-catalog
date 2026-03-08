import { getPayload } from 'payload'
import Image from 'next/image'
import Link from 'next/link'
import type { Product, Media, Category } from '@/payload-types'
import config from '@/payload.config'
import './styles.css'
import { ProductFilters } from './components/ProductFilters'
import { Pagination } from './components/Pagination'
import { CategorySidebar } from './components/CategorySidebar'
import { TranslatedText } from './components/TranslatedText'
import { CategoryName } from './components/CategoryName'

interface HomePageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
    category?: string | string[]
    lang?: string
  }>
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

interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<number, CategoryTreeNode>()
  const rootCategories: CategoryTreeNode[] = []

  // Создать карту всех категорий с пустыми массивами children
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // Построить дерево
  categories.forEach((cat) => {
    const category = categoryMap.get(cat.id)
    if (!category) return

    if (cat.parent) {
      const parentId = typeof cat.parent === 'object' ? cat.parent.id : cat.parent
      const parent = categoryMap.get(parentId)
      if (parent) {
        parent.children.push(category)
      } else {
        // Если родитель не найден, добавляем в корень
        rootCategories.push(category)
      }
    } else {
      rootCategories.push(category)
    }
  })

  return rootCategories
}

async function getImageUrl(image: number | Media, payload: any): Promise<string | null> {
  if (typeof image === 'number') {
    try {
      const media = await payload.findByID({
        collection: 'media',
        id: image,
        depth: 0,
      })
      return media?.url || media?.thumbnailURL || null
    } catch {
      return null
    }
  }
  return image?.url || image?.thumbnailURL || null
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const currentPage = parseInt(params.page || '1', 10)
  const searchQuery = params.search || ''
  let sortParam = params.sort || '-createdAt'
  const lang = (params.lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'
  
  // Преобразуем старые значения сортировки в новые локализованные
  if (sortParam === 'title' || sortParam === '-title') {
    sortParam = sortParam === 'title' ? `title_${lang}` : `-title_${lang}`
  }
  // Преобразуем сортировку по цене в локализованную
  if (sortParam === 'price' || sortParam === '-price') {
    sortParam = sortParam === 'price' ? `price_${lang}` : `-price_${lang}`
  }
  
  // Поддержка множественных категорий из URL
  const categoryParam = params.category
  const selectedCategoryIds = categoryParam
    ? (Array.isArray(categoryParam) ? categoryParam : [categoryParam]).map(id => parseInt(id, 10))
    : []

  // Получаем все категории для построения дерева (если таблица ещё не создана — используем пустой массив)
  let allCategories: Category[] = []
  try {
    const result = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1000,
    })
    allCategories = result.docs
  } catch {
    // Таблица categories может отсутствовать до первого push схемы или миграции
    allCategories = []
  }

  const categoryTree = buildCategoryTree(allCategories)

  // Функция для получения всех дочерних категорий рекурсивно
  function getAllChildCategoryIds(categoryId: number, categories: Category[]): number[] {
    const result: number[] = [categoryId]
    const children = categories.filter(cat => {
      const parentId = typeof cat.parent === 'object' ? cat.parent?.id : cat.parent
      return parentId === categoryId
    })
    
    for (const child of children) {
      result.push(...getAllChildCategoryIds(child.id, categories))
    }
    
    return result
  }

  // Формируем where условие для поиска
  const where: any = {}
  if (searchQuery) {
    where.or = [
      { title_ru: { contains: searchQuery } },
      { title_en: { contains: searchQuery } },
      { description_ru: { contains: searchQuery } },
      { description_en: { contains: searchQuery } },
    ]
  }
  if (selectedCategoryIds.length > 0) {
    // Получаем все ID категорий включая дочерние
    const allCategoryIds = new Set<number>()
    selectedCategoryIds.forEach(id => {
      getAllChildCategoryIds(id, allCategories).forEach(childId => allCategoryIds.add(childId))
    })
    
    where.category = { in: Array.from(allCategoryIds) }
  }

  // Получаем продукты (если таблицы ещё нет — пустой список)
  let docs: Product[] = []
  let totalDocs = 0
  let hasNextPage = false
  let page = currentPage
  try {
    const result = await payload.find({
      collection: 'products',
      limit: 10,
      page: currentPage,
      where,
      sort: sortParam,
      depth: 1, // Для получения связанных данных (image, category)
    })
    docs = result.docs
    totalDocs = result.totalDocs
    hasNextPage = result.hasNextPage ?? false
    page = result.page ?? currentPage
  } catch {
    // Таблица products может отсутствовать до push схемы
  }

  // Обрабатываем изображения для каждого продукта
  const productsWithImages = await Promise.all(
    docs.map(async (product: Product) => {
      const imageUrl = await getImageUrl(product.image, payload)
      return {
        ...product,
        imageUrl,
      }
    })
  )

  return (
    <div className="catalog">
      <div className="catalog-layout">
        <CategorySidebar categories={categoryTree} selectedCategoryIds={selectedCategoryIds} lang={lang} />
        <div className="catalog-content">
          <div className="catalog-header">
            <TranslatedText translationKey="catalog.title" as="h1" />
            <ProductFilters search={searchQuery} sort={sortParam} categoryIds={selectedCategoryIds} lang={lang} />
          </div>

      {productsWithImages.length === 0 ? (
        <div className="catalog-empty">
          <TranslatedText translationKey="catalog.empty" as="p" />
        </div>
      ) : (
        <>
          <div className="products-grid">
            {productsWithImages.map((product) => {
              const category = typeof product.category === 'object' 
                ? product.category 
                : null
              
              // Получаем локализованные поля
              const productTitle = getLocalizedField(product, 'title', lang)
              const productDescription = getLocalizedField(product, 'description', lang)
              const categoryName = category ? getLocalizedField(category, 'name', lang) : ''
              const { price, symbol } = getLocalizedPrice(product, lang)

              return (
                <Link key={product.id} href={`/${product.id}?lang=${lang}`} className="product-card">
                  {product.imageUrl ? (
                    <div className="product-image">
                      <Image
                        src={product.imageUrl}
                        alt={productTitle}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={product.imageUrl.includes('/api/media/')}
                      />
                    </div>
                  ) : (
                    <div className="product-image-placeholder">
                      <span>Нет изображения</span>
                    </div>
                  )}
                  <div className="product-info">
                    <h3 className="product-title">{productTitle}</h3>
                    {productDescription && (
                      <p className="product-description">
                        {productDescription.length > 100
                          ? `${productDescription.substring(0, 100)}...`
                          : productDescription}
                      </p>
                    )}
                    <div className="product-meta">
                      <span className="product-category"><CategoryName name={categoryName} /></span>
                      <span className="product-price">{price} {symbol}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <Pagination
            currentPage={page || currentPage}
            totalDocs={totalDocs}
            hasNextPage={hasNextPage || false}
            search={searchQuery}
            sort={sortParam}
            categoryIds={selectedCategoryIds}
            lang={lang}
          />
        </>
      )}
        </div>
      </div>
    </div>
  )
}
