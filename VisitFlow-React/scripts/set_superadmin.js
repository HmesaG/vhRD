
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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

// ID del usuario a promover (hmesag@gmail.com según logs anteriores)
const TARGET_UID = "t0Mtj5glgbglqVMcRXOF5Ybd0Io2";

async function promoteUser() {
    console.log(`🚀 Promoviendo usuario ${TARGET_UID} a superadmin...`);
    try {
        await updateDoc(doc(db, "users", TARGET_UID), {
            role: 'superadmin'
        });
        console.log("✅ Usuario actualizado a 'superadmin' exitosamente.");
    } catch (error) {
        console.error("❌ Error al actualizar usuario:", error);
    }
}

promoteUser();
