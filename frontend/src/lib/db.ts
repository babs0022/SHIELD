import { neon } from '@neondatabase/serverless';

if (!process.env.POSTGRES_URL) {
  throw new Error('Missing POSTGRES_URL environment variable');
}

const sql = neon(process.env.POSTGRES_URL);

export default sql;
