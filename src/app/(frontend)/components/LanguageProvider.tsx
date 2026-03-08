'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentLanguage, setLanguage, t, translations } from '@/lib/translations'

interface LanguageContextType {
  lang: 'ru' | 'en'
  setLang: (lang: 'ru' | 'en') => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Инициализируем с языком из URL параметра или localStorage
  const [lang, setLangState] = useState<'ru' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      // Сначала проверяем URL параметр (приоритет выше)
      const urlParams = new URLSearchParams(window.location.search)
      const urlLang = urlParams.get('lang')
      if (urlLang === 'ru' || urlLang === 'en') {
        // Сохраняем в localStorage для будущих загрузок
        setLanguage(urlLang)
        return urlLang
      }
      // Иначе читаем из localStorage
      return getCurrentLanguage()
    }
    return 'ru'
  })

  useEffect(() => {
    // Проверяем URL параметр при монтировании (приоритет выше)
    const urlParams = new URLSearchParams(window.location.search)
    const urlLang = urlParams.get('lang')
    
    if (urlLang === 'ru' || urlLang === 'en') {
      // Если есть URL параметр, используем его и сохраняем в localStorage
      if (urlLang !== lang) {
        setLanguage(urlLang)
        setLangState(urlLang)
      }
    } else {
      // Если нет URL параметра, читаем из localStorage только один раз
      const savedLang = getCurrentLanguage()
      if (savedLang !== lang) {
        setLangState(savedLang)
      }
    }

    // Слушаем изменения localStorage только для синхронизации между вкладками/окнами
    // НЕ проверяем изменения в том же окне, чтобы избежать циклов
    const handleStorageChange = (e: StorageEvent) => {
      // StorageEvent срабатывает только при изменениях в других окнах/вкладках
      if (e.key === 'language' && e.newValue) {
        const newLang = e.newValue as 'ru' | 'en'
        // Проверяем, что нет URL параметра, который имеет приоритет
        const currentUrlParams = new URLSearchParams(window.location.search)
        const currentUrlLang = currentUrlParams.get('lang')
        if (!currentUrlLang && newLang !== lang) {
          setLangState(newLang)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, []) // Запускаем только один раз при монтировании

  const setLang = (newLang: 'ru' | 'en') => {
    setLanguage(newLang)
    setLangState(newLang)
  }

  const translate = (key: string) => {
    // Просто возвращаем перевод для текущего языка
    // Не меняем состояние здесь, чтобы избежать циклов обновлений
    return t(key, lang)
  }

  // Всегда предоставляем контекст, даже до монтирования
  // Это гарантирует, что useLanguage всегда работает
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  )
}
