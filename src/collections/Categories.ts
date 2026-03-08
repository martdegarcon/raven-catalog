import { CollectionConfig } from 'payload'

// Функция для вычисления displayName
async function calculateDisplayName(
  nameRu: string,
  nameEn: string,
  parentId: string | number | { id: string | number } | null | undefined,
  payload: any
): Promise<string> {
  if (!nameRu) return ''
  
  if (parentId) {
    try {
      let id: string | number | null | undefined
      
      if (typeof parentId === 'string' || typeof parentId === 'number') {
        id = parentId
      } else if (parentId && typeof parentId === 'object' && 'id' in parentId) {
        id = parentId.id
      } else {
        id = null
      }
      
      // Проверяем, что id не null и не undefined перед вызовом findByID
      if (id !== null && id !== undefined) {
        const parent = await payload.findByID({
          collection: 'categories',
          id: id,
          depth: 0,
        })
        
        if (parent && parent.name_ru) {
          // Формируем отображаемое имя: "кастом (родитель)" используя русское имя
          return `${nameRu} (${parent.name_ru})`
        }
      }
    } catch (error) {
      // Если родитель не найден, возвращаем просто имя
      return nameRu
    }
  }
  
  // Если родителя нет, возвращаем просто имя
  return nameRu
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'displayName',
  },
  fields: [
    {
      name: 'name_ru',
      type: 'text',
      required: true,
      label: 'Название (Русский)',
    },
    {
      name: 'name_en',
      type: 'text',
      required: false,
      label: 'Название (English)',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories', // ссылка на саму себя для вложенности
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Если это подкатегория, выбери родителя',
      },
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        hidden: true, // Скрываем поле в админке, оно только для отображения
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Вычисляем displayName перед сохранением
        if (data.name_ru) {
          data.displayName = await calculateDisplayName(
            data.name_ru || '',
            data.name_en || '',
            data.parent,
            req.payload
          )
        }
        return data
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        // Обновляем displayName при чтении (на случай, если родитель изменился)
        if (!doc || !doc.name_ru) return doc
        
        // Если родитель явно null или undefined, просто используем имя
        if (doc.parent === null || doc.parent === undefined) {
          doc.displayName = doc.name_ru
          return doc
        }
        
        // Вычисляем displayName только если есть родитель
        doc.displayName = await calculateDisplayName(
          doc.name_ru || '',
          doc.name_en || '',
          doc.parent,
          req.payload
        )
        return doc
      },
    ],
  },
}
