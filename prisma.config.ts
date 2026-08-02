import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Força o arquivo a ler as suas variáveis do .env
dotenv.config();

export default defineConfig({
  migrate: {
    url: process.env.DATABASE_URL,
  },
  datasource: {
    url: process.env.DATABASE_URL,
  }
});