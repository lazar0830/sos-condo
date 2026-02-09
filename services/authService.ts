import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { auth, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import * as fs from './firestoreService';
import type { User } from '../types';
import { UserRole } from '../types';

export async function signUp(
  email: string,
  password: string,
  username: string
): Promise<{ user: User | null; error?: string }> {
  if (!auth) return { user: null, error: 'Firebase Auth not configured.' };
  try {
    const cred: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const existingUsers = await fs.getUsers();
    const isFirstUser = existingUsers.length === 0;
    const role = isFirstUser ? UserRole.SuperAdmin : UserRole.PropertyManager;
    const userProfile: User = {
      id: uid,
      email,
      username,
      role,
    };
    await fs.setUser(userProfile);
    return { user: userProfile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: msg };
  }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!auth) return { user: null, error: 'Firebase Auth not configured.' };
  try {
    await signInWithEmailAndPassword(auth, email, password);
    const fbUser = auth.currentUser;
    if (!fbUser) return { user: null, error: 'Sign in succeeded but no user.' };
    // Brief delay so Firestore picks up the new auth token
    await new Promise((r) => setTimeout(r, 150));
    let profile = await fs.getUserById(fbUser.uid);
    // Auto-create profile if user exists in Auth but not in Firestore (e.g. empty DB)
    if (!profile) {
      const existingUsers = await fs.getUsers();
      const isFirstUser = existingUsers.length === 0;
      const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
      profile = {
        id: fbUser.uid,
        email: fbUser.email || email,
        username: displayName,
        role: isFirstUser ? UserRole.SuperAdmin : UserRole.PropertyManager,
      };
      await fs.setUser(profile);
    }
    return { user: profile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: msg };
  }
}

export async function createUserForAdmin(
  email: string,
  password: string,
  username: string,
  role: 'Admin' | 'Property Manager' | 'Service Provider',
  createdBy: string
): Promise<{ uid?: string; error?: string }> {
  if (!functions || !auth?.currentUser) return { error: 'Not configured or not signed in.' };
  try {
    const createUserFn = httpsCallable<
      { email: string; password: string; username: string; role: string; createdBy: string },
      { uid: string }
    >(functions, 'createUser');
    const result = await createUserFn({ email, password, username, role, createdBy });
    return { uid: result.data.uid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export async function logOut(): Promise<void> {
  if (auth) await signOut(auth);
}

export function subscribeToAuth(cb: (fbUser: FirebaseUser | null) => void): (() => void) | null {
  if (!auth) return null;
  return onAuthStateChanged(auth, cb);
}
