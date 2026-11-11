import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Payload camelCase -> snake_case for SQL columns
  await db.run(sql`
    ALTER TABLE products ADD COLUMN pre_order numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite: DROP COLUMN unsupported (no-op)
  console.warn('Rollback not implemented for products.pre_order column')
}
