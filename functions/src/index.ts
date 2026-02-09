import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
  role: 'Admin' | 'Property Manager' | 'Service Provider';
  createdBy: string;
}

export const createUser = functions.https.onCall(async (data: CreateUserRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const callerUid = context.auth.uid;
  const db = admin.firestore();

  // Verify caller is Super Admin, Admin, or Property Manager
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
  }
  const callerRole = callerDoc.data()?.role;
  const canCreateUsers = callerRole === 'Super Admin' || callerRole === 'Admin' || callerRole === 'Property Manager';
  if (!canCreateUsers) {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admin, Admin, or Property Manager can create users.');
  }

  // Super Admin: Admin, Property Manager, Service Provider
  // Admin: Property Manager, Service Provider
  // Property Manager: Service Provider only
  const { email, password, username, role, createdBy } = data;
  if (!email || !password || !username || !role || !createdBy) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }
  if (role === 'Admin' && callerRole !== 'Super Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admin can create Admins.');
  }
  if (role === 'Property Manager' && callerRole === 'Property Manager') {
    throw new functions.https.HttpsError('permission-denied', 'Property Managers cannot create other Property Managers.');
  }

  const auth = admin.auth();
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new functions.https.HttpsError('invalid-argument', msg);
  }

  const userProfile = {
    email,
    username,
    role,
    createdBy,
  };
  await db.collection('users').doc(userRecord.uid).set(userProfile);

  return { uid: userRecord.uid };
});
