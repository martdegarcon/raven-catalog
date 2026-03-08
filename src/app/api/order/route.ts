import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, contactType, productIds, lang, customSelections: bodyCustomSelections } = body
    const requestLang = lang === 'en' ? 'en' : 'ru'
    const customSelectionsByProduct = (bodyCustomSelections && typeof bodyCustomSelections === 'object') ? bodyCustomSelections as Record<string, Record<string, string>> : {}

    if (!contact || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать контакт и выбрать хотя бы один продукт' },
        { status: 400 }
      )
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || ''

    // Получаем информацию о продуктах и сохраняем заказы
    const orders = await Promise.all(
      productIds.map(async (id: number) => {
        try {
          const product = await payload.findByID({
            collection: 'products',
            id,
            depth: 2, // категория + media для картинки
          })

          if (!product) {
            return null
          }

          const productTitle = (product.title_ru as string) || (product.title_en as string) || 'Без названия'
          const category = typeof product.category === 'object' ? product.category : null
          const categoryName = category
            ? ((category.name_ru as string) || (category.name_en as string) || '')
            : ''

          let imageUrl: string | null = null
          const image = product.image
          if (image && typeof image === 'object' && 'url' in image && image.url) {
            const url = image.url as string
            imageUrl = url.startsWith('http') ? url : `${origin}${url.startsWith('/') ? '' : '/'}${url}`
          }

          const orderSelections = customSelectionsByProduct[String(id)] ?? {}
          const customSelectionsArray = Object.entries(orderSelections).map(([fieldLabel, selectedValue]) => ({
            fieldLabel,
            selectedValue,
          }))

          const order = await payload.create({
            collection: 'orders',
            data: {
              product: id,
              productId: id,
              productTitle,
              category: category ? category.id : null,
              categoryName,
              contact,
              contactType,
              status: 'new',
              customSelections: customSelectionsArray,
            },
          })

          const rawCustom = Array.isArray(product.customFields) ? product.customFields : []
          const customFieldsForEmail: { label: string; value: string; url?: string }[] = []
          for (const f of rawCustom) {
            if (!f || typeof f !== 'object') continue
            const type = (f as { type?: string }).type ?? 'text'
            const label = requestLang === 'en' && (f as { label_en?: string }).label_en
              ? (f as { label_en: string }).label_en
              : (f as { label_ru?: string }).label_ru ?? ''
            if (!label) continue
            if (type === 'select') {
              const selected = orderSelections[(f as { label_ru?: string }).label_ru ?? '']
              if (selected != null) customFieldsForEmail.push({ label, value: selected })
            } else if (type === 'checkbox') {
              const checked = (f as { valueCheckbox?: boolean }).valueCheckbox
              customFieldsForEmail.push({ label, value: checked ? (requestLang === 'en' ? 'Yes' : 'Да') : (requestLang === 'en' ? 'No' : 'Нет') })
            } else if (type === 'link') {
              const linkF = f as { linkUrl?: string; linkText_ru?: string; linkText_en?: string }
              const url = linkF.linkUrl ?? ''
              const linkText = requestLang === 'en' && linkF.linkText_en != null ? linkF.linkText_en : (linkF.linkText_ru ?? url)
              customFieldsForEmail.push({ label, value: linkText || url, url: url || undefined })
            } else {
              const val = requestLang === 'en' && (f as { value_en?: string }).value_en != null
                ? (f as { value_en: string }).value_en
                : (f as { value_ru?: string }).value_ru ?? ''
              customFieldsForEmail.push({ label, value: val })
            }
          }
          for (const [fieldLabel, selectedValue] of Object.entries(orderSelections)) {
            const alreadyAdded = rawCustom.some(
              (f) => f && typeof f === 'object' && (f as { type?: string }).type === 'select' && ((f as { label_ru?: string }).label_ru ?? '') === fieldLabel
            )
            if (alreadyAdded) continue
            customFieldsForEmail.push({
              label: fieldLabel,
              value: selectedValue,
            })
          }

          return {
            id: product.id,
            title: productTitle,
            price_ru: product.price_ru,
            price_en: product.price_en,
            imageUrl,
            customFields: customFieldsForEmail,
            orderId: order.id,
          }
        } catch (error) {
          console.error(`Error processing product ${id}:`, error)
          return null
        }
      })
    )

    const validOrders = orders.filter((o): o is NonNullable<typeof o> => o !== null)

    if (validOrders.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось найти выбранные продукты или создать заказы' },
        { status: 400 }
      )
    }

    const totalPriceRu = validOrders.reduce((sum, o) => sum + ((o.price_ru as number) || 0), 0)
    const totalPriceEn = validOrders.reduce((sum, o) => sum + ((o.price_en as number) || 0), 0)
    const langLabel = requestLang === 'en' ? 'English' : 'Русский'
    const dateStr = new Date().toLocaleString('ru-RU')

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const emailSubject = `Новая заявка на мечи - ${contactType === 'email' ? contact : 'Telegram: ' + contact}`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #07080b; color: #ffffff; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .row { margin-bottom: 16px; }
    .label { font-weight: bold; color: #555; margin-bottom: 4px; }
    .order-block { background-color: #ffffff; padding: 20px; margin: 16px 0; border-left: 4px solid #07080b; border-radius: 8px; }
    .product-image { max-width: 100%; height: auto; max-height: 280px; display: block; border-radius: 8px; margin-top: 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .total { font-size: 18px; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Новая заявка на световые мечи</h1>
    </div>
    <div class="content">
      <div class="row">
        <div class="label">Контакты</div>
        <div>${contactType === 'email' ? 'Email' : 'Telegram'}: ${contact}</div>
      </div>
      <div class="row">
        <div class="label">Язык обращения</div>
        <div>${langLabel}</div>
      </div>

      ${validOrders.map((o) => `
      <div class="order-block">
        <div class="row">
          <div class="label">Модель</div>
          <div>${o.title} (ID: ${o.id})</div>
        </div>
        <div class="row">
          <div class="label">Фотка модели</div>
          ${o.imageUrl ? `<img src="${o.imageUrl}" alt="${o.title}" class="product-image" width="400" />` : '<span style="color:#999;">Нет изображения</span>'}
        </div>
        <div class="row">
          <div class="label">Цена</div>
          <div>${o.price_ru || 0} ₽${o.price_en ? ` / ${o.price_en} €` : ''}</div>
        </div>
        ${(o.customFields && o.customFields.length > 0) ? `
        <div class="row">
          <div class="label">Доп. характеристики</div>
          <div>${o.customFields.map((f: { label: string; value: string; url?: string }) => `<div>${escapeHtml(f.label)}: ${f.url ? `<a href="${escapeHtml(f.url)}">${escapeHtml(f.value)}</a>` : escapeHtml(f.value)}</div>`).join('')}</div>
        </div>
        ` : ''}
      </div>
      `).join('')}

      <div class="total">
        Общая сумма: ${totalPriceRu} ₽${totalPriceEn > 0 ? ` / ${totalPriceEn} €` : ''}
      </div>
      <div class="row" style="margin-top: 24px;">
        <div class="label">Дата</div>
        <div><small>${dateStr}</small></div>
      </div>
    </div>
    <div class="footer">
      <p>Это автоматическое уведомление о новой заявке</p>
    </div>
  </div>
</body>
</html>
    `

    // Отправляем email через Resend (на обе почты)
    const recipientEmails = [
      process.env.ORDER_EMAIL || 'info@raven-custom.com',
      'raven.custom.works@gmail.com',
    ].filter(Boolean)
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'orders@raven-custom.com'

    if (resendApiKey && resendFromEmail && recipientEmails.length > 0) {
      try {
        const resend = new Resend(resendApiKey)

        const { data, error } = await resend.emails.send({
          from: resendFromEmail,
          to: recipientEmails,
          subject: emailSubject,
          html: emailHtml,
        })

        if (error) {
          console.error('Resend API error:', error)
          throw error
        }
        console.log(`Email принят Resend, id: ${data?.id}. Получатели: ${recipientEmails.join(', ')}. Проверьте статус доставки в Resend → Emails.`)
      } catch (emailError: any) {
        // Не блокируем создание заказа, если email не отправился
        console.error('=== ОШИБКА ОТПРАВКИ EMAIL ===')
        console.error('Ошибка:', emailError)
        console.error('Сообщение:', emailError?.message)
        console.error('Код статуса:', emailError?.statusCode || emailError?.status)
        console.error('Получатели:', recipientEmails.join(', '))
        console.error('Отправитель:', resendFromEmail)
        
        // Пытаемся извлечь детальную информацию об ошибке
        if (emailError?.response) {
          console.error('Ответ от Resend:', JSON.stringify(emailError.response, null, 2))
        }
        if (emailError?.body) {
          console.error('Тело ошибки:', JSON.stringify(emailError.body, null, 2))
        }
        
        console.log('=== НОВАЯ ЗАЯВКА (email не отправлен) ===')
        console.log('Тема:', emailSubject)
        console.log('Создано заказов:', validOrders.length)
        console.log('===================')
      }
    } else {
      // Если API ключ не настроен, просто логируем
      console.warn('RESEND_API_KEY не настроен. Email уведомление не отправлено.')
      console.log('=== НОВАЯ ЗАЯВКА ===')
      console.log('Тема:', emailSubject)
      console.log('Создано заказов:', validOrders.length)
      console.log('===================')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Заявка успешно отправлена',
      ordersCreated: validOrders.length,
    })
  } catch (error) {
    console.error('Error processing order:', error)
    return NextResponse.json(
      { error: 'Ошибка при обработке заявки' },
      { status: 500 }
    )
  }
}
