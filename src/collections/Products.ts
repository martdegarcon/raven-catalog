import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title_ru',
  },
  fields: [
    {
      name: 'title_ru',
      type: 'text',
      required: true,
      label: 'Название (Русский)',
    },
    {
      name: 'title_en',
      type: 'text',
      required: false,
      label: 'Название (English)',
    },
    {
      name: 'price_ru',
      type: 'number',
      required: true,
      label: 'Цена в рублях (RUB)',
    },
    {
      name: 'price_en',
      type: 'number',
      required: false,
      label: 'Цена в евро (EUR)',
    },
    {
      name: 'description_ru',
      type: 'textarea',
      label: 'Описание (Русский)',
    },
    {
      name: 'description_en',
      type: 'textarea',
      label: 'Описание (English)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Основное фото (если `Фотографии` не заполнены) / Main photo (fallback)',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: false,
      label: 'Фотографии / Photos',
      admin: {
        description: 'Загрузите несколько фотографий для автослайдера на карточке товара / Upload multiple photos for the hover slider',
      },
    },
    {
      name: 'sound',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Звук (mp3) / Audio (mp3)',
      admin: {
        description: 'Загрузите mp3 файл. Если он задан, на странице товара появится плеер / Upload an mp3 file to show an audio player on the product page',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Выбери категорию для продукта',
      },
    },
    {
      name: 'customFields',
      type: 'array',
      label: 'Дополнительные характеристики / Additional characteristics',
      admin: {
        description:
          'Добавьте дополнительные характеристики: текст (RU/EN), чекбокс, выбор одного варианта (напр. язык фразы) или ссылку (URL + название). Для типа «Выбор» укажите список опций — пользователь выберет одну при заказе. / Add additional characteristics: text (RU/EN), checkbox, single-select options (e.g. phrase language) or a link (URL + label). For “select” provide options — the user will pick one during ordering.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'label_ru',
          type: 'text',
          required: true,
          label: 'Название поля (рус)',
          admin: { placeholder: 'Напр. Вес, Язык фразы' },
        },
        {
          name: 'label_en',
          type: 'text',
          required: false,
          label: 'Название поля (англ)',
          admin: { placeholder: 'e.g. Weight, Phrase language' },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Тип',
          defaultValue: 'text',
          options: [
            { label: 'Текст', value: 'text' },
            { label: 'Число', value: 'number' },
            { label: 'Дата', value: 'date' },
            { label: 'Длинный текст', value: 'textarea' },
            { label: 'Чекбокс', value: 'checkbox' },
            { label: 'Выбор одного варианта', value: 'select' },
            { label: 'Ссылка', value: 'link' },
          ],
        },
        {
          name: 'value_ru',
          type: 'text',
          required: false,
          label: 'Значение (рус)',
          admin: {
            placeholder: 'Значение поля',
            condition: (_, siblingData) => siblingData?.type !== 'checkbox' && siblingData?.type !== 'select' && siblingData?.type !== 'link',
          },
        },
        {
          name: 'value_en',
          type: 'text',
          required: false,
          label: 'Значение (англ)',
          admin: {
            placeholder: 'Value',
            condition: (_, siblingData) => siblingData?.type !== 'checkbox' && siblingData?.type !== 'select' && siblingData?.type !== 'link',
          },
        },
        {
          name: 'linkUrl',
          type: 'text',
          required: false,
          label: 'URL ссылки',
          admin: {
            placeholder: 'https://...',
            condition: (_, siblingData) => siblingData?.type === 'link',
          },
        },
        {
          name: 'linkText_ru',
          type: 'text',
          required: false,
          label: 'Текст ссылки (рус)',
          admin: {
            placeholder: 'Напр. Скачать инструкцию',
            condition: (_, siblingData) => siblingData?.type === 'link',
          },
        },
        {
          name: 'linkText_en',
          type: 'text',
          required: false,
          label: 'Текст ссылки (англ)',
          admin: {
            placeholder: 'e.g. Download manual',
            condition: (_, siblingData) => siblingData?.type === 'link',
          },
        },
        {
          name: 'valueCheckbox',
          type: 'checkbox',
          label: 'Включено',
          defaultValue: false,
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'checkbox',
          },
        },
        {
          name: 'options',
          type: 'array',
          label: 'Варианты выбора',
          admin: {
            description: 'Добавьте варианты (напр. 9 языков). Пользователь выберет один при заказе.',
            condition: (_, siblingData) => siblingData?.type === 'select',
          },
          fields: [
            {
              name: 'label_ru',
              type: 'text',
              required: true,
              label: 'Вариант (рус)',
            },
            {
              name: 'label_en',
              type: 'text',
              required: false,
              label: 'Вариант (англ)',
            },
            {
              name: 'value',
              type: 'text',
              required: false,
              label: 'Код (опционально)',
              admin: { description: 'Для сохранения в заказе (напр. es, en)' },
            },
          ],
        },
      ],
    },
  ],
}
