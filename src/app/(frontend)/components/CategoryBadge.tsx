'use client'

import { useLanguage } from './LanguageProvider'

interface CategoryBadgeProps {
  name: string | null | undefined
}

export function CategoryBadge({ name }: CategoryBadgeProps) {
  const { t } = useLanguage()
  return <>{name || t('catalog.noCategory')}</>
}
