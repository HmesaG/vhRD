// Script de inicialización de Firebase para VisitFlow
// Este script crea la estructura inicial de datos en Firestore

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

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

async function initializeFirestore() {
    console.log('🚀 Iniciando configuración de Firestore...');

    try {
        // 1. Crear primera organización
        console.log('📦 Creando organización inicial...');
        const orgRef = await addDoc(collection(db, 'organizations'), {
            name: 'GMV Soluciones',
            nit: '900123456-7',
            address: 'Calle Principal 123, Bogotá',
            phone: '+57 300 123 4567',
            email: 'contacto@gmv.com',
            logo_url: '',
            createdAt: serverTimestamp()
        });
        console.log('✅ Organización creada con ID:', orgRef.id);

        // 2. Crear usuario superadmin (DEBES REEMPLAZAR EL UID)
        console.log('👤 Creando usuario superadmin...');
        console.log('⚠️  IMPORTANTE: Debes reemplazar "YOUR_FIREBASE_AUTH_UID" con el UID real del usuario');

        // NOTA: Primero debes crear el usuario en Firebase Authentication
        // y luego reemplazar "YOUR_FIREBASE_AUTH_UID" con el UID real
        const userUid = 'YOUR_FIREBASE_AUTH_UID'; // ⚠️ REEMPLAZAR CON UID REAL

        await setDoc(doc(db, 'users', userUid), {
            email: 'hmesag@gmail.com',
            role: 'superadmin',
            companyId: orgRef.id,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Usuario superadmin vinculado');

        // 3. Crear motivos de visita iniciales
        console.log('📋 Creando motivos de visita...');
        const reasons = [
            { label: 'Reunión', requiresBadge: true },
            { label: 'Entrega', requiresBadge: true },
            { label: 'Mantenimiento', requiresBadge: true },
            { label: 'Proveedor', requiresBadge: true },
            { label: 'Visita Comercial', requiresBadge: false }
        ];

        for (const reason of reasons) {
            await addDoc(collection(db, 'reasons'), {
                ...reason,
                companyId: orgRef.id
            });
        }
        console.log('✅ Motivos de visita creados');

        // 4. Crear carnets iniciales
        console.log('🎫 Creando carnets...');
        for (let i = 1; i <= 20; i++) {
            const badgeNumber = i.toString().padStart(3, '0');
            await addDoc(collection(db, 'badges'), {
                number: badgeNumber,
                companyId: orgRef.id
            });
        }
        console.log('✅ 20 carnets creados (001-020)');

        // 5. Crear empleados de ejemplo
        console.log('👥 Creando empleados de ejemplo...');
        const employees = [
            {
                name: 'Carlos López',
                area: 'Sistemas',
                email: 'carlos.lopez@gmv.com',
                whatsapp: '+57 300 111 1111'
            },
            {
                name: 'María García',
                area: 'Recursos Humanos',
                email: 'maria.garcia@gmv.com',
                whatsapp: '+57 300 222 2222'
            },
            {
                name: 'Juan Martínez',
                area: 'Administración',
                email: 'juan.martinez@gmv.com',
                whatsapp: '+57 300 333 3333'
            }
        ];

        for (const employee of employees) {
            await addDoc(collection(db, 'employees'), {
                ...employee,
                companyId: orgRef.id
            });
        }
        console.log('✅ Empleados de ejemplo creados');

        // 6. Crear empresas visitantes de ejemplo
        console.log('🏢 Creando empresas visitantes de ejemplo...');
        const companies = [
            'Proveedor ABC',
            'Cliente XYZ',
            'Servicios Generales',
            'Mensajería Express'
        ];

        for (const company of companies) {
            await addDoc(collection(db, 'companies'), {
                name: company,
                companyId: orgRef.id
            });
        }
        console.log('✅ Empresas visitantes creadas');

        console.log('\n🎉 ¡Configuración completada exitosamente!');
        console.log('\n📝 PRÓXIMOS PASOS:');
        console.log('1. Ve a Firebase Console → Authentication');
        console.log('2. Crea un usuario con email: hmesag@gmail.com');
        console.log('3. Copia el UID del usuario creado');
        console.log('4. Reemplaza "YOUR_FIREBASE_AUTH_UID" en este script con el UID real');
        console.log('5. Ejecuta este script nuevamente para vincular el usuario');
        console.log('\n🔗 Firebase Console: https://console.firebase.google.com/project/flutterapp-ba14b');
        console.log(`\n🏢 ID de tu organización: ${orgRef.id}`);
        console.log('   (Guarda este ID, lo necesitarás para vincular usuarios)');

    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        console.error('Detalles:', error.message);
    }
}

// Ejecutar la inicialización
initializeFirestore();
