import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// scripts/dev.sh and the E2E tests set this to use the offline demo-sano project in the emulators.
const useEmulators = process.env.EXPO_PUBLIC_FIREBASE_EMULATORS === '1';

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_CONFIG: FirebaseOptions = {
  apiKey: 'demo-key',
  authDomain: 'demo-sano.firebaseapp.com',
  projectId: 'demo-sano',
};

function firebaseConfig(): FirebaseOptions {
  if (useEmulators) return EMULATOR_CONFIG;
  throw new Error('The Firebase web config of the real project is not set yet. Use scripts/dev.sh for the emulators.');
}

export const app = initializeApp(firebaseConfig());
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

if (useEmulators) {
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
}
