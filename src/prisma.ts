import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Cria a conexão com o banco usando a sua URL do Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Inicializa o adaptador do PostgreSQL
const adapter = new PrismaPg(pool);

// 3. Passa o adaptador para o PrismaClient
const prisma = new PrismaClient({ adapter });

// Exporta o Prisma pronto para ser usado no resto do projeto
export default prisma;