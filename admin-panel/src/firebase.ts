// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBjJ8oKwTmyez89yje7Rzgg6bP_Oli8udk",
    authDomain: "monitoringhub-11e20.firebaseapp.com",
    projectId: "monitoringhub-11e20",
    storageBucket: "monitoringhub-11e20.firebasestorage.app",
    messagingSenderId: "401237586879",
    appId: "1:401237586879:web:6c8b12584d4a4f14e0e70a",
    measurementId: "G-WLJYCMLK1S"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { firebaseConfig };