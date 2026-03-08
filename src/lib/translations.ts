export const translations = {
  ru: {
    catalog: {
      title: "Каталог продуктов",
      empty: "Продукты не найдены",
      noCategory: "Без категории",
      backToCatalog: "Вернуться в каталог",
      backToSite: "Вернуться на сайт",
      noImage: "Нет изображения",
      description: "Описание"
    },
    filters: {
      search: "Поиск:",
      searchPlaceholder: "Поиск по названию или описанию...",
      sortAlphabet: "Сортировка по алфавиту:",
      sortPrice: "Сортировка по цене:",
      default: "По умолчанию",
      aToZ: "A-Z",
      zToA: "Z-A",
      priceLowToHigh: "От дешевых к дорогим",
      priceHighToLow: "От дорогих к дешевым"
    },
    categories: {
      title: "Категории",
      resetAll: "Сбросить все",
      notFound: "Категории не найдены",
      expand: "Развернуть",
      collapse: "Свернуть"
    },
    order: {
      title: "Оставить заявку",
      contactMethod: "Способ связи",
      email: "Email",
      telegram: "Telegram",
      emailPlaceholder: "your@email.com",
      telegramPlaceholder: "@username",
      selectedProduct: "Выбранный меч:",
      submit: "Отправить заявку",
      submitting: "Отправка...",
      success: "Заявка успешно отправлена!",
      error: "Ошибка при отправке заявки"
    },
    product: {
      notFound: "Продукт не найден",
      additionalSpecs: "Дополнительные характеристики"
    },
    pagination: {
      showing: "Показано",
      of: "из",
      products: "продуктов",
      previous: "Назад",
      next: "Вперед"
    }
  },
  en: {
    catalog: {
      title: "Product Catalog",
      empty: "Products not found",
      noCategory: "No category",
      backToCatalog: "Back to catalog",
      backToSite: "Back to site",
      noImage: "No image",
      description: "Description"
    },
    filters: {
      search: "Search:",
      searchPlaceholder: "Search by name or description...",
      sortAlphabet: "Sort by alphabet:",
      sortPrice: "Sort by price:",
      default: "Default",
      aToZ: "A-Z",
      zToA: "Z-A",
      priceLowToHigh: "Low to high",
      priceHighToLow: "High to low"
    },
    categories: {
      title: "Categories",
      resetAll: "Reset all",
      notFound: "Categories not found",
      expand: "Expand",
      collapse: "Collapse"
    },
    order: {
      title: "Place an order",
      contactMethod: "Contact method",
      email: "Email",
      telegram: "Telegram",
      emailPlaceholder: "your@email.com",
      telegramPlaceholder: "@username",
      selectedProduct: "Selected saber:",
      submit: "Submit order",
      submitting: "Submitting...",
      success: "Order successfully submitted!",
      error: "Error submitting order"
    },
    product: {
      notFound: "Product not found",
      additionalSpecs: "Additional specifications"
    },
    pagination: {
      showing: "Showing",
      of: "of",
      products: "products",
      previous: "Previous",
      next: "Next"
    }
  }
}

// Функция для получения текущего языка
export function getCurrentLanguage(): 'ru' | 'en' {
  if (typeof window === 'undefined') return 'ru'
  try {
    const saved = localStorage.getItem('language')
    if (saved === 'ru' || saved === 'en') {
      return saved
    }
  } catch (e) {
    // localStorage может быть недоступен
  }
  return 'ru'
}

// Функция для установки языка
export function setLanguage(lang: 'ru' | 'en'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('language', lang)
}

// Функция для получения перевода
export function t(key: string, lang?: 'ru' | 'en'): string {
  const currentLang = lang || getCurrentLanguage()
  const keys = key.split('.')
  let value: any = translations[currentLang]
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k]
    } else {
      return key // Возвращаем ключ, если перевод не найден
    }
  }
  
  return typeof value === 'string' ? value : key
}
