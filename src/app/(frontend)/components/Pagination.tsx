'use client'

import Link from 'next/link'
import { useLanguage } from './LanguageProvider'

interface PaginationProps {
  currentPage: number
  totalDocs: number
  hasNextPage: boolean
  search: string
  sort: string
  categoryIds: number[]
  lang: 'ru' | 'en'
}

export function Pagination({ currentPage, totalDocs, hasNextPage, search, sort, categoryIds, lang }: PaginationProps) {
  const { t } = useLanguage()
  const totalPages = Math.ceil(totalDocs / 10)
  const hasPrevPage = currentPage > 1

  const buildURL = (page: number) => {
    const params = new URLSearchParams()
    if (search) {
      params.set('search', search)
    }
    if (sort && sort !== '-createdAt') {
      params.set('sort', sort)
    }
    categoryIds.forEach(id => {
      params.append('category', id.toString())
    })
    params.set('lang', lang)
    params.set('page', page.toString())
    return `/?${params.toString()}`
  }

  return (
    <div className="pagination">
      <div className="pagination-info">
        {t('pagination.showing')} {currentPage} {t('pagination.of')} {totalPages} ({totalDocs} {t('pagination.products')})
      </div>
      <div className="pagination-controls">
        {hasPrevPage ? (
          <Link href={buildURL(currentPage - 1)} className="pagination-button">
            ← {t('pagination.previous')}
          </Link>
        ) : (
          <span className="pagination-button disabled">← {t('pagination.previous')}</span>
        )}
        
        {hasNextPage ? (
          <Link href={buildURL(currentPage + 1)} className="pagination-button">
            {t('pagination.next')} →
          </Link>
        ) : (
          <span className="pagination-button disabled">{t('pagination.next')} →</span>
        )}
      </div>
    </div>
  )
}
