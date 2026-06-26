import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres.bwtqplvzvtddvpleqxfa:AriyancomBD10@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  },
});
