import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Test Firestore connection. Call this to verify DB is reachable.
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 */
export async function testFirestoreConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!db) {
    return { ok: false, error: 'Firebase not configured. Add VITE_FIREBASE_* vars to .env.local' };
  }

  try {
    // Simple read from a collection (empty is fine - we just test the connection)
    const testRef = collection(db, '_connection_test');
    await getDocs(testRef);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
