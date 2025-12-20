import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

console.log('🔄 Running migrations...');

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrations completed successfully');
    process.exit(0);
} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}
