// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: "sendy-a327c.firebaseapp.com",
  projectId: "sendy-a327c",
  storageBucket: "sendy-a327c.appspot.com",
  messagingSenderId: "930104475372",
  appId: "1:930104475372:web:004f3d3ff7e259a8032fc9"
};

// Initialize Firebase
export const fbApp = initializeApp(firebaseConfig);