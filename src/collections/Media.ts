import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      // Alt необязателен для заполнения: если пусто — берём имя файла без расширения
      ({ data, req }) => {
        if (!data) return data
        const alt = typeof data.alt === 'string' ? data.alt.trim() : ''
        if (!alt) {
          const name = (data.filename as string | undefined) || req?.file?.name || ''
          data.alt = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Фото'
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Описание (Alt)',
      admin: {
        description: 'Можно не заполнять — подставится имя файла / Optional: the file name is used if empty',
      },
    },
  ],
  upload: true,
}
