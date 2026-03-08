import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

const MAX_RETRIES = 4
const RETRY_DELAY_MS = 4000

function isNetworkError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? [err.message, (err as { cause?: Error }).cause?.message].filter(Boolean).join(' ')
      : String(err)
  return /ECONNRESET|ETIMEDOUT|fetch failed|network|ECONNREFUSED/i.test(msg)
}

/**
 * Создаёт недостающие таблицы payload_preferences и payload_preferences_rels.
 * С повторными попытками при обрыве связи с Turso (миграция идемпотентна).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const run = async (): Promise<void> => {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`payload_migrations\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`name\` text,
        \`batch\` numeric,
        \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
        \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
      )
    `)
    await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`)`)
    await db.run(sql`
      INSERT OR IGNORE INTO \`payload_migrations\` (\`name\`, \`batch\`, \`updated_at\`, \`created_at\`)
      VALUES ('20260205_074017', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`payload_preferences\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`key\` text,
        \`value\` text,
        \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
        \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
      )
    `)
    await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`)`)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`payload_preferences_rels\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`order\` integer,
        \`parent_id\` integer NOT NULL,
        \`path\` text NOT NULL,
        \`users_id\` integer,
        FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
      )
    `)
    // Индексы на _rels опущены, чтобы уменьшить число запросов к Turso (часто ECONNRESET).
    // При необходимости их можно добавить отдельной миграцией позже.
  }

  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await run()
      return
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRIES && isNetworkError(err)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`payload_preferences_rels\``)
  await db.run(sql`DROP TABLE IF EXISTS \`payload_preferences\``)
}
