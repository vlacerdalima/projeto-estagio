import { Pool } from 'pg';

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'seu_banco_de_dados',
        user: process.env.DB_USER || 'seu_usuario',
        password: process.env.DB_PASSWORD || 'sua_senha',
      }
);

export default pool;

