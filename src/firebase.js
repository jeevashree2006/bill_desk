import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCvELAwb7PlrAwaCpWzxqcDN0jjS1N0nTo",
    authDomain: "bill-desk-5f07c.firebaseapp.com",
    databaseURL: "https://bill-desk-5f07c-default-rtdb.firebaseio.com",
    projectId: "bill-desk-5f07c",
    storageBucket: "bill-desk-5f07c.firebasestorage.app",
    messagingSenderId: "627201462404",
    appId: "1:627201462404:web:33b9c69adcb6ce825972d1",
    measurementId: "G-B03VMMRSWE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
