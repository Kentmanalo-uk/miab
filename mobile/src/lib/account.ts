import AsyncStorage from '@react-native-async-storage/async-storage';
// SDK 54 rewrote expo-file-system around File/Directory objects. The previous
// API still ships at /legacy and is what the four calls below expect; moving
// to the new one is a separate change, not part of an SDK bump.
import * as FileSystem from 'expo-file-system/legacy';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
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
import { getDb } from './firebase';

/**
 * Account and data deletion.
 *
 * Google Play requires that an app which lets people create accounts also lets
 * them delete the account *and the data attached to it* — from inside the app
 * and from a public web page. This is the in-app half; the web page is
 * /delete-account on the website.
 *
 * ── What actually gets deleted ──
 *
 * 1. Every message this uid sent. The Firestore rules already permit the
 *    original sender to delete their own message, so this runs as the user and
 *    needs no privileged backend.
 * 2. Every review this uid wrote.
 * 3. Everything this app stored on the phone — favorites, collections, follows,
 *    search history, the local avatar file, caches.
 * 4. The Firebase Auth user itself, last, because once it is gone the rules no
 *    longer recognise the caller as the owner of anything above.
 *
 * ── What survives, and why it is said out loud ──
 *
 * Nothing is deleted from anyone else's device, and a message someone already
 * screenshotted or shared as an image is beyond reach. The confirmation copy in
 * the UI says exactly that rather than implying the internet can be recalled.
 */

/** Local keys written by this app, gathered from the contexts that own them. */
const LOCAL_KEYS = [
  'miab_avatar_uri',
  'miab_collections_v1',
  'miab_favorites',
  'miab_follows',
  'miab_last_sent',
  'miab_notifications_seen_at',
  'miab_onboarded_v1',
  'miab_recently_viewed',
  'miab_search_history',
  'miab_send_log',
  'miab_sent_to',
  // Deliberately NOT miab_theme: which colour scheme someone prefers is not
  // account data, and resetting it mid-flow makes the screen flash.
];

const CACHE_PREFIX = 'miab_cache:';

/** How many documents to pull per sweep. Firestore caps a batch of writes at 500. */
const SWEEP_SIZE = 200;

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

/**
 * Raised when the password given does not match, so the UI can say so precisely
 * instead of reporting a generic failure for something the person can fix.
 */
export class WrongPasswordError extends Error {
  constructor() {
    super('That password is not right.');
    this.name = 'WrongPasswordError';
  }
}

/**
 * Deletes every document in a collection whose `senderId` is this uid.
 *
 * Loops rather than fetching once: someone with more than SWEEP_SIZE messages
 * would otherwise keep the remainder, and a deletion that silently leaves data
 * behind is worse than one that fails loudly.
 */
async function deleteOwnedDocuments(
  collectionName: string,
  uid: string
): Promise<number> {
  const db = getDb();
  let total = 0;

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

    // A short page means that was the last of them.
    if (snapshot.size < SWEEP_SIZE) break;
  }

  return total;
}

/** Clears everything this app keeps on the device. */
export async function clearLocalData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(LOCAL_KEYS);
  } catch {
    /* best effort — a storage failure must not stop the account deletion */
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    const cached = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cached.length) await AsyncStorage.multiRemove(cached);
  } catch {
    /* as above */
  }

  // The avatar is a real file, not a stored string, so removing the key alone
  // would leave the image sitting in the app's documents directory.
  try {
    await FileSystem.deleteAsync(`${FileSystem.documentDirectory}avatar.jpg`, {
      idempotent: true,
    });
  } catch {
    /* as above */
  }
}

/**
 * Deletes the signed-in account and everything attached to it.
 *
 * `password` is required: Firebase refuses to delete a user whose sign-in is
 * more than a few minutes old, and asking up front is kinder than failing
 * halfway through and demanding it then. It is also the only confirmation that
 * the person holding an unlocked phone is the account's owner.
 */
export async function deleteAccountAndData(
  user: User,
  password: string,
  onStep?: (step: DeletionStep) => void
): Promise<DeletionSummary> {
  if (!user.email) {
    throw new Error(
      'This account has no email address, so it cannot be verified here. Please contact support.'
    );
  }

  onStep?.('reauthenticating');
  try {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password)
    );
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials'
    ) {
      throw new WrongPasswordError();
    }
    throw e;
  }

  // Content first, account last. Doing it the other way round would leave the
  // messages orphaned and undeletable — the rules only let the original sender
  // remove them, and that sender would no longer exist.
  onStep?.('messages');
  const messagesDeleted = await deleteOwnedDocuments('public_messages', user.uid);

  onStep?.('reviews');
  const reviewsDeleted = await deleteOwnedDocuments('reviews', user.uid);

  onStep?.('local');
  await clearLocalData();

  onStep?.('account');
  await deleteUser(user);

  return { messagesDeleted, reviewsDeleted };
}
