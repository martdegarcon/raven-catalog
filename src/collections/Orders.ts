import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'productTitle',
    defaultColumns: ['productTitle', 'contact', 'contactType', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        description: 'Связанный продукт',
      },
    },
    {
      name: 'productId',
      type: 'number',
      required: true,
      admin: {
        description: 'ID продукта',
        readOnly: true,
      },
    },
    {
      name: 'productTitle',
      type: 'text',
      required: true,
      admin: {
        description: 'Название меча',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Категория меча',
      },
    },
    {
      name: 'categoryName',
      type: 'text',
      admin: {
        description: 'Название категории (для отображения)',
        readOnly: true,
      },
    },
    {
      name: 'contact',
      type: 'text',
      required: true,
      admin: {
        description: 'Контакт пользователя (email или telegram)',
      },
    },
    {
      name: 'contactType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Email',
          value: 'email',
        },
        {
          label: 'Telegram',
          value: 'telegram',
        },
      ],
      admin: {
        description: 'Тип контакта',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        {
          label: 'Новая',
          value: 'new',
        },
        {
          label: 'В обработке',
          value: 'processing',
        },
        {
          label: 'Завершена',
          value: 'completed',
        },
      ],
      admin: {
        description: 'Статус заказа',
      },
    },
    {
      name: 'customSelections',
      type: 'array',
      label: 'Выборы покупателя',
      admin: {
        description: 'Выбранные варианты по полям типа «Выбор» (напр. язык фразы)',
      },
      fields: [
        { name: 'fieldLabel', type: 'text', required: true, label: 'Поле' },
        { name: 'selectedValue', type: 'text', required: true, label: 'Выбранное значение' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Автоматически заполняем categoryName при создании или обновлении
        if (data.category && typeof data.category === 'object' && 'id' in data.category) {
          try {
            const category = await req.payload.findByID({
              collection: 'categories',
              id: data.category.id,
              depth: 0,
            })
            if (category) {
              data.categoryName = (category.name_ru as string) || (category.name_en as string) || ''
            }
          } catch (error) {
            console.error('Error fetching category:', error)
          }
        } else if (data.category && (typeof data.category === 'string' || typeof data.category === 'number')) {
          try {
            const category = await req.payload.findByID({
              collection: 'categories',
              id: data.category,
              depth: 0,
            })
            if (category) {
              data.categoryName = (category.name_ru as string) || (category.name_en as string) || ''
            }
          } catch (error) {
            console.error('Error fetching category:', error)
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
}
