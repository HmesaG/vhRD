
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    doc,
    setDoc
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

async function verifyAndFix() {
    console.log("🔍 Verificando estado de la base de datos...");

    try {
        // 1. Verificar Organzaciones
        const orgsSnap = await getDocs(collection(db, "organizations"));
        let orgId = null;

        if (orgsSnap.empty) {
            console.log("⚠️ No se encontraron organizaciones. Creando una por defecto...");
            const orgRef = await addDoc(collection(db, "organizations"), {
                name: "GMV Soluciones",
                nit: "900123456-7",
                createdAt: serverTimestamp()
            });
            orgId = orgRef.id;
            console.log(`✅ Organización creada: ${orgId}`);
        } else {
            orgId = orgsSnap.docs[0].id;
            console.log(`✅ Organización encontrada: ${orgsSnap.docs[0].data().name} (${orgId})`);
        }

        // 2. Verificar Motivos
        const reasonsSnap = await getDocs(query(collection(db, "reasons"), where("companyId", "==", orgId)));
        if (reasonsSnap.empty) {
            console.log("⚠️ No se encontraron motivos de visita. Creando motivos básicos...");
            const reasons = [
                { label: 'Reunión', requiresBadge: true },
                { label: 'Entrega', requiresBadge: true },
                { label: 'Mantenimiento', requiresBadge: true },
                { label: 'Proveedor', requiresBadge: true },
                { label: 'Visita Comercial', requiresBadge: false }
            ];
            for (const r of reasons) {
                await addDoc(collection(db, "reasons"), { ...r, companyId: orgId });
            }
            console.log("✅ Motivos creados.");
        } else {
            console.log(`✅ ${reasonsSnap.size} motivos encontrados.`);
        }

        // 3. Verificar Carnets
        const badgesSnap = await getDocs(query(collection(db, "badges"), where("companyId", "==", orgId)));
        if (badgesSnap.empty) {
            console.log("⚠️ No se encontraron carnets. Creando 20 carnets...");
            for (let i = 1; i <= 20; i++) {
                await addDoc(collection(db, "badges"), {
                    number: i.toString().padStart(3, '0'),
                    companyId: orgId
                });
            }
            console.log("✅ Carnets creados.");
        } else {
            console.log(`✅ ${badgesSnap.size} carnets encontrados.`);
        }

        // 4. Verificar Usuarios sin CompanyId
        // Esto es un poco más difícil sin listUsers de admin, pero podemos ver si 'users' collection tiene algo
        // Si no podemos listar usuarios de Auth, al menos podemos ver si los de Firestore tienen companyId
        const usersSnap = await getDocs(collection(db, "users"));
        if (!usersSnap.empty) {
            console.log(`🔍 Revisando ${usersSnap.size} usuarios en Firestore...`);
            usersSnap.forEach(async (u) => {
                const data = u.data();
                if (!data.companyId) {
                    console.log(`⚠️ Usuario ${u.id} (${data.email}) no tiene companyId. Asignando ${orgId}...`);
                    await setDoc(doc(db, "users", u.id), { companyId: orgId }, { merge: true });
                    console.log(`✅ Usuario ${u.id} actualizado.`);
                } else {
                    console.log(`✅ Usuario ${u.id} (${data.email}) ya tiene companyId: ${data.companyId}`);
                }
            });
        } else {
            console.log("⚠️ No hay usuarios registrados en la colección 'users' de Firestore.");
            console.log("ℹ️  El usuario debe iniciar sesión para que se cree/vincule su documento, o usar el script init-firestore con su UID.");
        }

        // 5. Verificar Empleados (Hosts)
        const employeesSnap = await getDocs(query(collection(db, "employees"), where("companyId", "==", orgId)));
        if (employeesSnap.empty) {
            console.log("⚠️ No se encontraron empleados. Creando empleados de ejemplo...");
            const employees = [
                { name: 'Carlos López', area: 'Sistemas', email: 'carlos@gmv.com', whatsapp: '+573001111111' },
                { name: 'María García', area: 'RRHH', email: 'maria@gmv.com', whatsapp: '+573002222222' }
            ];
            for (const emp of employees) {
                await addDoc(collection(db, "employees"), { ...emp, companyId: orgId });
            }
            console.log("✅ Empleados creados.");
        } else {
            console.log(`✅ ${employeesSnap.size} empleados encontrados.`);
        }

        // 6. Verificar Empresas Visitantes
        const companiesSnap = await getDocs(query(collection(db, "companies"), where("companyId", "==", orgId)));
        if (companiesSnap.empty) {
            console.log("⚠️ No se encontraron empresas visitantes. Creando empresas de ejemplo...");
            const companies = ['Proveedor ABC', 'Cliente XYZ'];
            for (const c of companies) {
                await addDoc(collection(db, "companies"), { name: c, companyId: orgId });
            }
            console.log("✅ Empresas visitantes creadas.");
        } else {
            console.log(`✅ ${companiesSnap.size} empresas visitantes encontradas.`);
        }

    } catch (error) {
        console.error("❌ Error verificando DB:", error);
    }
}

verifyAndFix();
