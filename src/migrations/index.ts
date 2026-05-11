import * as migration_20260201_add_preferences from './20260201_add_preferences'
import * as migration_20260202_add_collections from './20260202_add_collections'
import * as migration_20260205_074017 from './20260205_074017'
import * as migration_20260510_add_products_sold_out from './20260510_add_products_sold_out'

export const migrations = [
  { up: migration_20260201_add_preferences.up, down: migration_20260201_add_preferences.down, name: '20260201_add_preferences' },
  { up: migration_20260202_add_collections.up, down: migration_20260202_add_collections.down, name: '20260202_add_collections' },
  { up: migration_20260205_074017.up, down: migration_20260205_074017.down, name: '20260205_074017' },
  { up: migration_20260510_add_products_sold_out.up, down: migration_20260510_add_products_sold_out.down, name: '20260510_add_products_sold_out' },
]
