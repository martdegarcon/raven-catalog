'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Category } from '@/payload-types'
import { useLanguage } from './LanguageProvider'

interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

interface CategorySidebarProps {
  categories: CategoryTreeNode[]
  selectedCategoryIds: number[]
  lang: 'ru' | 'en'
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

function CategoryItem({
  category,
  level = 0,
  selectedCategoryIds,
  onToggle,
  expandedCategories,
  toggleExpanded,
  t,
  lang,
}: {
  category: CategoryTreeNode
  level: number
  selectedCategoryIds: number[]
  onToggle: (id: number) => void
  expandedCategories: Set<number>
  toggleExpanded: (id: number) => void
  t: (key: string) => string
  lang: 'ru' | 'en'
}) {
  const hasChildren = category.children.length > 0
  const isExpanded = expandedCategories.has(category.id)
  const isSelected = selectedCategoryIds.includes(category.id)
  const categoryName = getLocalizedField(category, 'name', lang)

  return (
    <div className="category-item">
      <div
        className={`category-row ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {hasChildren && (
          <button
            className="category-toggle"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(category.id)
            }}
            aria-label={isExpanded ? t('categories.collapse') : t('categories.expand')}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        {!hasChildren && <span className="category-spacer" />}
        <label className="category-checkbox-label">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(category.id)}
            className="category-checkbox"
          />
          <span className="category-name">{categoryName}</span>
        </label>
      </div>
      {hasChildren && isExpanded && (
        <div className="category-children">
          {category.children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              selectedCategoryIds={selectedCategoryIds}
              onToggle={onToggle}
              expandedCategories={expandedCategories}
              toggleExpanded={toggleExpanded}
              t={t}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategorySidebar({ categories, selectedCategoryIds, lang }: CategorySidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  // Автоматически раскрывать категории, которые содержат выбранные категории
  const findAndExpandParents = (cats: CategoryTreeNode[], targetIds: number[]) => {
    if (targetIds.length === 0) return
    const expanded = new Set<number>()
    
    const findPath = (cat: CategoryTreeNode, path: number[] = []): number[] | null => {
      if (targetIds.includes(cat.id)) return [...path, cat.id]
      for (const child of cat.children) {
        const result = findPath(child, [...path, cat.id])
        if (result) return result
      }
      return null
    }

    for (const cat of cats) {
      const path = findPath(cat)
      if (path) {
        path.forEach((id) => expanded.add(id))
      }
    }
    
    setExpandedCategories(expanded)
  }

  // Раскрыть родительские категории при монтировании, если есть выбранные категории
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      findAndExpandParents(categories, selectedCategoryIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds])

  const toggleExpanded = (id: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCategoryToggle = (categoryId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Получаем текущие выбранные категории
    const currentCategories = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId]
    
    // Удаляем все параметры category
    params.delete('category')
    
    // Добавляем новые выбранные категории
    currentCategories.forEach(id => {
      params.append('category', id.toString())
    })
    
    // Сохраняем параметр lang
    params.set('lang', lang)
    
    // Сбрасываем страницу при изменении категории
    params.set('page', '1')
    
    router.push(`/?${params.toString()}`)
  }

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.set('lang', lang)
    params.set('page', '1')
    router.push(`/?${params.toString()}`)
  }

  return (
    <aside className="category-sidebar">
      <div className="sidebar-header">
        <h2>{t('categories.title')}</h2>
        {selectedCategoryIds.length > 0 && (
          <button
            className="clear-filter"
            onClick={handleClearAll}
          >
            {t('categories.resetAll')}
          </button>
        )}
      </div>
      <nav className="category-nav">
        {categories.length === 0 ? (
          <p className="no-categories">{t('categories.notFound')}</p>
        ) : (
          categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              level={0}
              selectedCategoryIds={selectedCategoryIds}
              onToggle={handleCategoryToggle}
              expandedCategories={expandedCategories}
              toggleExpanded={toggleExpanded}
              t={t}
              lang={lang}
            />
          ))
        )}
      </nav>
    </aside>
  )
}
