'use client'

import { useLanguage } from './LanguageProvider'

interface TranslatedTextProps {
  translationKey: string
  className?: string
  style?: React.CSSProperties
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export function TranslatedText({ translationKey, className, style, as = 'span' }: TranslatedTextProps) {
  const { t } = useLanguage()
  const Component = as

  return <Component className={className} style={style}>{t(translationKey)}</Component>
}
