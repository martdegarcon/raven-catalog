import React from 'react'
import './styles.css'
import { LanguageProvider } from './components/LanguageProvider'
import { BackToSite } from './components/BackToSite'

export const metadata = {
  description: 'Raven',
  title: 'Raven Catalog',
  icons: {
    icon: '/site-icon.png',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <BackToSite />
          <main>{children}</main>
        </LanguageProvider>
      </body>
    </html>
  )
}
