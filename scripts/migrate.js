const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('⚡ Connecting to database:', url.startsWith('libsql:') || url.startsWith('https:') ? 'Turso Cloud' : 'Local SQLite');

const client = createClient({
  url,
  authToken: authToken || undefined,
});

async function migrate() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL,
      image TEXT,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt DATETIME NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt DATETIME,
      refreshTokenExpiresAt DATETIME,
      scope TEXT,
      password TEXT,
      issuer TEXT,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME,
      updatedAt DATETIME
    );`,

    `CREATE TABLE IF NOT EXISTS collection (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      isPublic INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS asset (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      collectionId TEXT REFERENCES collection(id) ON DELETE SET NULL,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER,
      dataUrl TEXT,
      mapData TEXT,
      metadata TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_collection_userId ON collection(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_asset_userId ON asset(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_asset_collectionId ON asset(collectionId);`
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  // Ensure issuer column exists if table was already created
  try {
    await client.execute("ALTER TABLE account ADD COLUMN issuer TEXT;");
  } catch (e) {
    // column already exists
  }

  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('✅ Migrations completed successfully! Tables on Turso:', tables.rows.map(r => r.name).join(', '));
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
