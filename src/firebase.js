import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCBNonQS1AJiomWU2o3qnUh0Vn06VOAu0Y",
  authDomain: "ilb-stat.firebaseapp.com",
  projectId: "ilb-stat",
  storageBucket: "ilb-stat.firebasestorage.app",
  messagingSenderId: "192817767937",
  appId: "1:192817767937:web:4c3e6c1c9608456d528200",
  measurementId: "G-DY8HXMLSQ4"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);