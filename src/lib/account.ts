'use client';

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Account and data deletion.
 *
 * Google Play requires an app that lets people create accounts to also let them
 * delete the account *and its data*, both in the app and from a public web
 * page. This module is the shared engine; /delete-account is that public page,
 * and the mobile app has its own copy at mobile/src/lib/account.ts.
 *
 * Deletion order matters and is not arbitrary: the Firestore rules only let the
 * original sender delete their own message, so the auth user has to be the last
 * thing removed. Delete it first and every message that user wrote becomes
 * permanently undeletable by anyone but an admin.
 */

/** How many documents to pull per sweep. */
const SWEEP_SIZE = 200;

/** Browser keys this site writes. Cleared so a shared computer keeps nothing. */
const LOCAL_KEYS = [
  'messageDraft',
  'mitb_send_log',
  'mitb_last_sent',
  'miab_features_cache',
];

export interface DeletionSummary {
  messagesDeleted: number;
  reviewsDeleted: number;
}

export type DeletionStep =
  | 'reauthenticating'
  | 'messages'
  | 'reviews'
  | 'local'
  | 'account';

export class WrongPasswordError extends Error {
  constructor() {
    super('That password is not right.');
    this.name = 'WrongPasswordError';
  }
}

/** Raised when the browser blocks or the person closes the Google popup. */
export class ReauthCancelledError extends Error {
  constructor() {
    super('Verification was cancelled, so nothing was deleted.');
    this.name = 'ReauthCancelledError';
  }
}

async function deleteOwnedDocuments(
  collectionName: string,
  uid: string
): Promise<number> {
  const db = initializeFirebase().firestore;
  let total = 0;

  // Loops rather than fetching once: someone with more than SWEEP_SIZE messages
  // would otherwise keep the remainder, and a deletion that quietly leaves data
  // behind is worse than one that fails loudly.
  for (;;) {
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        where('senderId', '==', uid),
        limit(SWEEP_SIZE)
      )
    );
    if (snapshot.empty) break;

    await Promise.all(
      snapshot.docs.map((d) => deleteDoc(doc(db, collectionName, d.id)))
    );
    total += snapshot.size;

    if (snapshot.size < SWEEP_SIZE) break;
  }

  return total;
}

function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  for (const key of LOCAL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable — not a reason to fail the deletion */
    }
  }
}

/** True when this account signs in with a password rather than with Google. */
export function usesPassword(user: User): boolean {
  return user.providerData.some((p) => p.providerId === 'password');
}

/**
 * Deletes the signed-in account and everything attached to it.
 *
 * `password` is required for password accounts and ignored for Google ones,
 * which re-verify through a popup instead. Firebase refuses to delete a user
 * whose sign-in is more than a few minutes old, so re-verifying up front is
 * kinder than failing halfway and asking then.
 */
export async function deleteAccountAndData(
  user: User,
  password: string | undefined,
  onStep?: (step: DeletionStep) => void
): Promise<DeletionSummary> {
  onStep?.('reauthenticating');

  try {
    if (usesPassword(user)) {
      if (!user.email) {
        throw new Error(
          'This account has no email address, so it cannot be verified here.'
        );
      }
      if (!password) throw new WrongPasswordError();
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password)
      );
    } else {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials'
    ) {
      throw new WrongPasswordError();
    }
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/popup-blocked'
    ) {
      throw new ReauthCancelledError();
    }
    throw e;
  }

  onStep?.('messages');
  const messagesDeleted = await deleteOwnedDocuments('public_messages', user.uid);

  onStep?.('reviews');
  const reviewsDeleted = await deleteOwnedDocuments('reviews', user.uid);

  onStep?.('local');
  clearLocalData();

  onStep?.('account');
  await deleteUser(user);

  return { messagesDeleted, reviewsDeleted };
}
