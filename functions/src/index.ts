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

  // Verify caller is Super Admin or Admin
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
  }
  const callerRole = callerDoc.data()?.role;
  if (callerRole !== 'Super Admin' && callerRole !== 'Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admin or Admin can create users.');
  }

  // Super Admin can create Admin; Admin can create Property Manager and Service Provider
  const { email, password, username, role, createdBy } = data;
  if (!email || !password || !username || !role || !createdBy) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }
  if (role === 'Admin' && callerRole !== 'Super Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admin can create Admins.');
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
