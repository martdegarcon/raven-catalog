import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Создаёт таблицы коллекций (categories, media, products, orders) по текущей схеме приложения.
 * Используется когда в Turso есть только users и payload_preferences (после 20260201).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. categories (parent_id → self)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`categories\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`name_ru\` text NOT NULL,
      \`name_en\` text,
      \`parent_id\` integer,
      \`display_name\` text,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
    )
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`categories_parent_idx\` ON \`categories\` (\`parent_id\`)`)

  // 2. media (upload)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`media\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`alt\` text NOT NULL,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`url\` text,
      \`thumbnail_u_r_l\` text,
      \`filename\` text,
      \`mime_type\` text,
      \`filesize\` numeric,
      \`width\` numeric,
      \`height\` numeric,
      \`focal_x\` numeric,
      \`focal_y\` numeric
    )
  `)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`media_filename_idx\` ON \`media\` (\`filename\`)`)

  // 3. products (image_id → media, category_id → categories)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`products\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`title_ru\` text NOT NULL,
      \`title_en\` text,
      \`price_ru\` numeric NOT NULL,
      \`price_en\` numeric,
      \`description_ru\` text,
      \`description_en\` text,
      \`image_id\` integer NOT NULL,
      \`category_id\` integer NOT NULL,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
    )
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_image_idx\` ON \`products\` (\`image_id\`)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_category_idx\` ON \`products\` (\`category_id\`)`)

  // 4. orders (product_id → products, category_id → categories)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`orders\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`product_id\` integer NOT NULL,
      \`product_title\` text NOT NULL,
      \`category_id\` integer,
      \`category_name\` text,
      \`contact\` text NOT NULL,
      \`contact_type\` text NOT NULL,
      \`status\` text NOT NULL,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
    )
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`orders\``)
  await db.run(sql`DROP TABLE IF EXISTS \`products\``)
  await db.run(sql`DROP TABLE IF EXISTS \`media\``)
  await db.run(sql`DROP TABLE IF EXISTS \`categories\``)
}
