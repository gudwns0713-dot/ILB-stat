import { initializeApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCBNonQS1AJiomWU2o3qnUh0Vn06VOAu0Y",
  authDomain: "ilb-stat.firebaseapp.com",
  projectId: "ilb-stat",
  storageBucket: "ilb-stat.firebasestorage.app",
  messagingSenderId: "192817767937",
  appId: "1:192817767937:web:59e5c0c709866dfb528200",
  measurementId: "G-Q6GJHE4JW7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const provider =
  new GoogleAuthProvider();

export const login = () =>
  signInWithPopup(auth, provider);