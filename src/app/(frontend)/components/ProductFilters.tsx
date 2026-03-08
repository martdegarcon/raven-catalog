'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLanguage } from './LanguageProvider'

interface ProductFiltersProps {
  search: string
  sort: string
  categoryIds: number[]
  lang: 'ru' | 'en'
}

export function ProductFilters({ search: initialSearch, sort: initialSort, categoryIds, lang }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState(initialSort)

  useEffect(() => {
    setSearch(initialSearch)
    setSort(initialSort)
  }, [initialSearch, initialSort])

  const updateURL = (newSearch: string, newSort: string) => {
    const params = new URLSearchParams()
    if (newSearch) {
      params.set('search', newSearch)
    }
    if (newSort && newSort !== '-createdAt') {
      params.set('sort', newSort)
    }
    categoryIds.forEach(id => {
      params.append('category', id.toString())
    })
    // Сохраняем параметр lang
    params.set('lang', lang)
    // Сбрасываем страницу при изменении фильтров
    params.set('page', '1')
    router.push(`/?${params.toString()}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    updateURL(value, sort)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSort(value)
    updateURL(search, value)
  }

  return (
    <div className="filters">
      <div className="filter-group">
        <label htmlFor="search">{t('filters.search')}</label>
        <input
          id="search"
          type="text"
          placeholder={t('filters.searchPlaceholder')}
          value={search}
          onChange={handleSearchChange}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="sort-alphabet">{t('filters.sortAlphabet')}</label>
        <select
          id="sort-alphabet"
          value={sort === `title_${lang}` || sort === `-title_${lang}` ? sort : ''}
          onChange={(e) => {
            if (e.target.value) {
              handleSortChange(e)
            } else {
              // Если выбрано "По умолчанию", проверяем сортировку по цене
              const priceSort = sort === `price_${lang}` || sort === `-price_${lang}` ? sort : '-createdAt'
              updateURL(search, priceSort)
            }
          }}
          className="filter-select"
        >
          <option value="">{t('filters.default')}</option>
          <option value={`title_${lang}`}>{t('filters.aToZ')}</option>
          <option value={`-title_${lang}`}>{t('filters.zToA')}</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort-price">{t('filters.sortPrice')}</label>
        <select
          id="sort-price"
          value={sort === `price_${lang}` || sort === `-price_${lang}` ? sort : ''}
          onChange={(e) => {
            if (e.target.value) {
              handleSortChange(e)
            } else {
              // Если выбрано "По умолчанию", проверяем сортировку по алфавиту
              const alphabetSort = sort === `title_${lang}` || sort === `-title_${lang}` ? sort : '-createdAt'
              updateURL(search, alphabetSort)
            }
          }}
          className="filter-select"
        >
          <option value="">{t('filters.default')}</option>
          <option value={`price_${lang}`}>{t('filters.priceLowToHigh')}</option>
          <option value={`-price_${lang}`}>{t('filters.priceHighToLow')}</option>
        </select>
      </div>
    </div>
  )
}
