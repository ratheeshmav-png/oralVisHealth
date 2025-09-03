import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDB() {
  const db = await open({
    filename: './oralvis.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT,
      patientId TEXT,
      scanType TEXT,
      region TEXT,
      imageUrl TEXT,
      uploadDate TEXT
    )
  `);

  // Seed default users
  const bcrypt = await import('bcryptjs');
  const hashedTech = await bcrypt.hash('tech123', 10);
  const hashedDentist = await bcrypt.hash('dentist123', 10);

  await db.run(
    `INSERT OR IGNORE INTO users (email, password, role) VALUES 
      ('tech@example.com', ?, 'Technician'),
      ('dentist@example.com', ?, 'Dentist')`,
    [hashedTech, hashedDentist]
  );

  return db;
}
