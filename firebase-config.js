// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCikAWrMtiLw0WAYCH7I4iG6Wv2tMsEt9w",
  authDomain: "customer-care-841fe.firebaseapp.com",
  projectId: "customer-care-841fe",
  storageBucket: "customer-care-841fe.firebasestorage.app",
  messagingSenderId: "167461661789",
  appId: "1:167461661789:web:a1141fccdf4650b84eb1b4",
  measurementId: "G-EQ650CB20M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);