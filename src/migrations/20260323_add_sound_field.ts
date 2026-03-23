import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Добавляем колонку sound_id в products
  await db.run(sql`
    ALTER TABLE products ADD COLUMN sound_id INTEGER;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // В SQLite нельзя просто DROP COLUMN, поэтому можно оставить пустым
  // или сделать ручной откат через создание новой таблицы без колонки
  console.warn('Rollback not implemented for sound_id column')
}
