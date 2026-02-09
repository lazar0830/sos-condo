/**
 * One-time script to seed component_categories into Firestore.
 * 
 * Prerequisites:
 * 1. Create a service account key: Firebase Console → Project Settings → Service accounts → Generate new private key
 * 2. Save the JSON file and set its path in GOOGLE_APPLICATION_CREDENTIALS env var
 * 
 * Run: node scripts/seed-component-categories.mjs
 * Or:  GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json node scripts/seed-component-categories.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load component_categories.json
const jsonPath = join(projectRoot, 'component_categories.json');
let data;
try {
  const raw = readFileSync(jsonPath, 'utf-8');
  data = JSON.parse(raw);
} catch (e) {
  console.error('Failed to read component_categories.json:', e.message);
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('Error: Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON file.');
  console.error('Get it from: Firebase Console → Project Settings → Service accounts → Generate new private key');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} catch (e) {
  console.error('Failed to read service account file:', e.message);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  try {
    await db.doc('component_categories/default').set(data);
    console.log('Done! Component categories imported to Firestore (component_categories/default).');
  } catch (e) {
    console.error('Import failed:', e.message);
    process.exit(1);
  }
}

seed();
