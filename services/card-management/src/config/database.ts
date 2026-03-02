import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'neobank',
    user: process.env.DB_USER || 'neobank',
    password: process.env.DB_PASSWORD || 'neobank_dev',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 2, max: 10 },
});

export default db;
