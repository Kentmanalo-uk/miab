/**
 * Firebase web app configuration.
 *
 * These values are NOT secrets. Firebase's web config is public by design: it
 * ships in every visitor's JavaScript bundle, and access is controlled by the
 * Firestore security rules (firestore.rules), not by hiding the API key.
 *
 * The defaults are this project's own config, so a deploy with no
 * NEXT_PUBLIC_FIREBASE_* variables set still builds. Without them, prerendering
 * fails with auth/invalid-api-key, the build exits, and the host has nothing
 * to run (on Hostinger that showed up as a 503 on every URL). Environment
 * variables still override the defaults, e.g. to point a staging deploy at a
 * different project.
 *
 * Genuine secrets (Spotify client secret, Gemini key, geo key) never go here.
 */
function env(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback;
}

export const firebaseConfig = {
  apiKey: env(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'AIzaSyAfR_F6Jeg1cLo5HsOX21R1JoLLpuSrwqA'),
  authDomain: env(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, 'studio-6364901469-82342.firebaseapp.com'),
  projectId: env(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'studio-6364901469-82342'),
  storageBucket: env(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 'studio-6364901469-82342.appspot.com'),
  messagingSenderId: env(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, '1046022135356'),
  appId: env(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, '1:1046022135356:web:9fbaa658ef24fddb6cad39'),
};
