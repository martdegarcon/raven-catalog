import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['payload', '@payloadcms/db-sqlite', 'sharp'],
  images: {
    remotePatterns: [
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
