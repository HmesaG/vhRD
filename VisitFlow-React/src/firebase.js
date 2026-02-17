import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDhaC60NEfwU7bwMekQOVaZk-Gz4kQte0k",
    authDomain: "flutterapp-ba14b.firebaseapp.com",
    projectId: "flutterapp-ba14b",
    storageBucket: "flutterapp-ba14b.firebasestorage.app",
    messagingSenderId: "637648342875",
    appId: "1:637648342875:web:73b5386b3f8802b409d47e",
    measurementId: "G-MNQJ7DCBV4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export {
    db,
    storage,
    auth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    where,
    ref,
    uploadString,
    getDownloadURL,
    writeBatch,
    sendPasswordResetEmail
};
