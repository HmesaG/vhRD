import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDhaC60NEfwU7bwMekQOVaZk-Gz4kQte0k",
    authDomain: "flutterapp-ba14b.firebaseapp.com",
    projectId: "flutterapp-ba14b",
    storageBucket: "flutterapp-ba14b.firebasestorage.app",
    messagingSenderId: "637648342875",
    appId: "1:637648342875:web:73b5386b3f8802b409d47e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const uid = "t0Mtj5glgbglqVMcRXOF5Ybd0Io2"; // hmesag@gmail.com
const userRef = doc(db, "users", uid);

try {
    console.log("Actualizando usuario a superadmin...");
    await setDoc(userRef, {
        role: "superadmin",
        email: "hmesag@gmail.com",
        companyId: "a0xf6a869pHc1RpYND1l", // Grupo Mesa Vasquez Srl
        updatedAt: new Date()
    }, { merge: true });
    console.log("✅ Usuario actualizado correctamente.");
} catch (e) {
    console.error("❌ Error:", e);
}
process.exit();
