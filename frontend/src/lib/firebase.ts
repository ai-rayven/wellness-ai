import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// scripts/dev.sh and the E2E tests set this to use the offline demo-sano project in the emulators.
const useEmulators = process.env.EXPO_PUBLIC_FIREBASE_EMULATORS === '1';

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_CONFIG: FirebaseOptions = {
  apiKey: 'demo-key',
  authDomain: 'demo-sano.firebaseapp.com',
  projectId: 'demo-sano',
  storageBucket: 'demo-sano.appspot.com',
};

// The web app of the sano-331c2 project. Public by design: the Security Rules protect the data.
const PROJECT_CONFIG: FirebaseOptions = {
  apiKey: 'AIzaSyAWeG15LCx_h_JoTiPD6yqjTRSlZAjulns',
  authDomain: 'sano-331c2.firebaseapp.com',
  projectId: 'sano-331c2',
  storageBucket: 'sano-331c2.firebasestorage.app',
  messagingSenderId: '904264513760',
  appId: '1:904264513760:web:01fb1f62515694add93885',
};

const firebaseConfig = (): FirebaseOptions => (useEmulators ? EMULATOR_CONFIG : PROJECT_CONFIG);

export const app = initializeApp(firebaseConfig());
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

if (useEmulators) {
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);
}
