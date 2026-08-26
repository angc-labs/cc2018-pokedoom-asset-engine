import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let finalUrl = tursoUrl || 'file:./local.db';
if (tursoUrl && authToken && !tursoUrl.includes('authToken=')) {
  const separator = tursoUrl.includes('?') ? '&' : '?';
  finalUrl = `${tursoUrl}${separator}authToken=${authToken}`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: finalUrl,
  },
});
