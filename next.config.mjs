import { withPayload } from '@payloadcms/next/withPayload'

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(basePath && { basePath, assetPrefix: basePath }),
  serverExternalPackages: ['payload', '@payloadcms/db-sqlite', 'sharp'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raven-custom.com', pathname: '/api/**' },
      { protocol: 'https', hostname: 'raven-custom.com', pathname: '/catalog/api/**' },
      { protocol: 'https', hostname: 'www.raven-custom.com', pathname: '/api/**' },
      { protocol: 'https', hostname: 'www.raven-custom.com', pathname: '/catalog/api/**' },
      { protocol: 'https', hostname: 'catalog.raven-custom.com', pathname: '/api/**' },
      { protocol: 'https', hostname: 'raven-catalog.vercel.app', pathname: '/api/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/api/**', port: '3000' },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
