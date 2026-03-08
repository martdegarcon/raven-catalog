'use client'

import { useState } from 'react'
import { useLanguage } from './LanguageProvider'

export type SelectFieldOption = {
  label_ru: string
  label_en?: string | null
  value?: string | null
  id?: string | null
}

export type SelectField = {
  label_ru: string
  label_en?: string | null
  options: SelectFieldOption[]
  id?: string | null
}

interface OrderFormProps {
  productId?: number
  productTitle?: string
  selectFields?: SelectField[]
}

export function OrderForm({ productId, productTitle, selectFields = [] }: OrderFormProps) {
  const { t, lang } = useLanguage()
  const [contact, setContact] = useState('')
  const [contactType, setContactType] = useState<'email' | 'telegram'>('email')
  const [selectedProducts, setSelectedProducts] = useState<number[]>(productId ? [productId] : [])
  const [selectSelections, setSelectSelections] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const customSelections: Record<number, Record<string, string>> = {}
    if (productId && selectFields.length > 0) {
      const entries: Record<string, string> = {}
      selectFields.forEach((field, i) => {
        const selected = selectSelections[i]
        if (selected != null && selected !== '') {
          entries[field.label_ru] = selected
        }
      })
      if (Object.keys(entries).length > 0) customSelections[productId] = entries
    }

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact,
          contactType,
          productIds: selectedProducts,
          lang,
          customSelections: Object.keys(customSelections).length > 0 ? customSelections : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: t('order.success') })
        setContact('')
        setSelectSelections({})
        if (!productId) {
          setSelectedProducts([])
        }
      } else {
        setMessage({ type: 'error', text: data.error || t('order.error') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('order.error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '24px',
      background: 'var(--base-200)',
      borderRadius: '8px',
      border: '1px solid var(--base-secondary-fade)'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        fontSize: '20px',
        fontWeight: 900,
        textTransform: 'uppercase',
        fontFamily: '"Inter", sans-serif',
        color: 'var(--base-300)'
      }}>
        {t('order.title')}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--base-secondary-dark)',
            textTransform: 'uppercase',
            fontFamily: '"Inter", monospace',
            letterSpacing: '0.04em'
          }}>
            {t('order.contactMethod')}
          </label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="email"
                checked={contactType === 'email'}
                onChange={(e) => setContactType(e.target.value as 'email' | 'telegram')}
                style={{ accentColor: 'var(--base-300)' }}
              />
              <span style={{ color: 'var(--base-secondary-dark)' }}>{t('order.email')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="telegram"
                checked={contactType === 'telegram'}
                onChange={(e) => setContactType(e.target.value as 'email' | 'telegram')}
                style={{ accentColor: 'var(--base-300)' }}
              />
              <span style={{ color: 'var(--base-secondary-dark)' }}>{t('order.telegram')}</span>
            </label>
          </div>
          <input
            type={contactType === 'email' ? 'email' : 'text'}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={contactType === 'email' ? t('order.emailPlaceholder') : t('order.telegramPlaceholder')}
            required
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--base-100)',
              border: '1px solid var(--base-secondary-fade)',
              borderRadius: '4px',
              color: 'var(--base-300)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--base-secondary-dark)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--base-secondary-fade)'}
          />
        </div>

        {selectFields.map((field, i) => {
          const fieldLabel = (lang === 'en' && field.label_en) ? field.label_en : field.label_ru
          const options = field.options ?? []
          return (
            <div key={field.id ?? `select-${i}`}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--base-secondary-dark)',
                textTransform: 'uppercase',
                fontFamily: '"Inter", monospace',
                letterSpacing: '0.04em'
              }}>
                {fieldLabel}
              </label>
              <select
                value={selectSelections[i] ?? ''}
                onChange={(e) => setSelectSelections((prev) => ({ ...prev, [i]: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--base-100)',
                  border: '1px solid var(--base-secondary-fade)',
                  borderRadius: '4px',
                  color: 'var(--base-300)',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '16px'
                }}
              >
                <option value="">{lang === 'en' ? 'Choose...' : 'Выберите...'}</option>
                {options.map((opt, j) => {
                  const optLabel = (lang === 'en' && opt.label_en) ? opt.label_en : opt.label_ru
                  const valueToStore = opt.value ?? optLabel
                  return (
                    <option key={opt.id ?? j} value={valueToStore}>
                      {optLabel}
                    </option>
                  )
                })}
              </select>
            </div>
          )
        })}

        {message && (
          <div style={{
            padding: '12px',
            background: message.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
            borderRadius: '4px',
            color: message.type === 'success' ? 'var(--base-secondary-dark)' : 'var(--base-300)',
            fontSize: '14px'
          }}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: 'var(--base-100)',
            border: '1px solid var(--base-secondary-fade)',
            borderRadius: '4px',
            color: 'var(--base-300)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '16px',
            fontWeight: 900,
            textTransform: 'uppercase',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = 'var(--base-200)'
              e.currentTarget.style.borderColor = 'var(--base-secondary-dark)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = 'var(--base-100)'
              e.currentTarget.style.borderColor = 'var(--base-secondary-fade)'
            }
          }}
        >
          {isSubmitting ? t('order.submitting') : t('order.submit')}
        </button>
      </div>
    </form>
  )
}
