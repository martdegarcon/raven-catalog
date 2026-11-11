import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Orders } from './collections/Orders'
import { migrations } from './migrations'

// Домены, с которых браузер загружает фото прямо в бакет (минуя лимит Vercel 4,5 МБ)
const uploadOrigins = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://catalog.raven-custom-saber.com',
      'https://catalog.raven-custom.com',
      'https://raven-catalog.vercel.app',
    ].filter((v): v is string => Boolean(v)),
  ),
)

const s3Config = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://s3.regru.cloud',
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
}

// Разрешаем бакету принимать загрузки из браузера (CORS). Идемпотентно, ошибки только логируются.
async function applyBucketCors(log: (msg: string) => void) {
  if (!process.env.S3_BUCKET || process.env.S3_APPLY_CORS === 'false') return
  try {
    await new S3Client(s3Config).send(
      new PutBucketCorsCommand({
        Bucket: process.env.S3_BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: uploadOrigins,
              AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    )
    log(`[s3-cors] applied for ${uploadOrigins.join(', ')}`)
  } catch (err) {
    log(`[s3-cors] failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_APP_URL,

  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [Users, Media, Products, Categories, Orders],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
      ...(process.env.DATABASE_AUTH_TOKEN && { authToken: process.env.DATABASE_AUTH_TOKEN }),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),

  sharp,
  onInit: async (payload) => {
    await applyBucketCors((msg) => payload.logger.info(msg))
  },
  plugins: [
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      // Прямая загрузка из браузера в бакет: включается переменной S3_CLIENT_UPLOADS=true
      clientUploads: process.env.S3_CLIENT_UPLOADS === 'true',
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: s3Config,
    }),
  ],
})
