
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    Timestamp
} from "firebase/firestore";

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

async function addSampleVisits() {
    console.log("🚀 Generando visitas de ejemplo...");

    try {
        // 1. Obtener Org ID (asumimos la primera)
        const orgsSnap = await getDocs(collection(db, "organizations"));
        if (orgsSnap.empty) {
            console.error("❌ No hay organizaciones. Ejecuta primero verify_and_fix.js");
            return;
        }
        const orgId = orgsSnap.docs[0].id;
        console.log(`🏢 Usando organización: ${orgId}`);

        // 2. Obtener datos auxiliares
        const employees = (await getDocs(query(collection(db, "employees"), where("companyId", "==", orgId)))).docs.map(d => d.data());
        const reasons = (await getDocs(query(collection(db, "reasons"), where("companyId", "==", orgId)))).docs.map(d => d.data().label);
        const badges = (await getDocs(query(collection(db, "badges"), where("companyId", "==", orgId)))).docs.map(d => d.data().number); // Cuidado de no repetir activos

        if (employees.length === 0 || reasons.length === 0) {
            console.error("❌ Faltan empleados o motivos.");
            return;
        }

        const companies = ['Proveedor ABC', 'Cliente XYZ', 'Tech Solutions', 'Logística Express'];

        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // 3. Crear Visitas Finalizadas (Históricas)
        console.log("📜 Creando historial de visitas...");
        for (let i = 0; i < 5; i++) {
            const checkInDate = new Date();
            checkInDate.setHours(8 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60)); // Hoy entre 8am y 1pm

            const checkOutDate = new Date(checkInDate);
            checkOutDate.setHours(checkInDate.getHours() + 1 + Math.floor(Math.random() * 2)); // Duración 1-3h

            await addDoc(collection(db, "visits"), {
                companyId: orgId,
                full_name: `Visitante Histórico ${i + 1}`,
                company: rand(companies),
                reason: rand(reasons),
                employee: rand(employees).name,
                visitor_email: 'test@example.com',
                visitor_phone: '',
                badge_number: rand(badges),
                check_in: Timestamp.fromDate(checkInDate),
                check_out: Timestamp.fromDate(checkOutDate),
                status: 'Salida',
                photo_url: null
            });
        }

        // 4. Crear Visitas Activas (En planta)
        console.log("🟢 Creando visitas activas...");
        for (let i = 0; i < 3; i++) {
            const checkInDate = new Date();
            checkInDate.setHours(new Date().getHours() - Math.floor(Math.random() * 2)); // Hace 0-2 horas

            await addDoc(collection(db, "visits"), {
                companyId: orgId,
                full_name: `Visitante Activo ${i + 1}`,
                company: rand(companies),
                reason: rand(reasons),
                employee: rand(employees).name,
                visitor_email: 'test@example.com',
                visitor_phone: '',
                badge_number: badges[i], // Usar primeros badges para evitar colisión en demo simple
                check_in: Timestamp.fromDate(checkInDate),
                check_out: null,
                status: 'Ingresado',
                photo_url: null
            });
        }

        console.log("✅ ¡Datos de ejemplo generados exitosamente!");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

addSampleVisits();
