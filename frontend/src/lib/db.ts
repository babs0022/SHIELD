import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  throw new Error('Missing POSTGRES_URL environment variable');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Add a global error handler to the pool to prevent crashes
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // You might want to add more robust error handling or logging here
});

export default pool;
