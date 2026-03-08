'use client'

import { useLanguage } from './LanguageProvider'

interface CategoryNameProps {
  name: string | null | undefined
}

export function CategoryName({ name }: CategoryNameProps) {
  const { t } = useLanguage()
  return <>{name || t('catalog.noCategory')}</>
}
