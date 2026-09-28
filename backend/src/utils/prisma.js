const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres@127.0.0.1:5433/pharmacy_db?schema=public'
    }
  }
});

module.exports = prisma;

