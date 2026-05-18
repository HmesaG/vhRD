/**
 * VisitFlow — Carga de Datos de Prueba
 * Inserta datos realistas dominicanos para testing
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
    host: '31.97.100.82',
    port: 8432,
    user: 'postgres',
    password: 'zX9!nQ2pL_7tR4vB',
    database: 'visitflow'
});

const ORG_ID = 'a0000000-0000-0000-0000-000000000001'; // GMV

async function seed() {
    const client = await pool.connect();
    console.log('🔌 Conectado a PostgreSQL\n');

    try {
        await client.query('BEGIN');

        // ──────────────────────────────────────────
        // 1. USUARIOS ADICIONALES
        // ──────────────────────────────────────────
        console.log('👤 Creando usuarios...');
        const passHash = await bcrypt.hash('admin123', 10);

        const users = [
            ['recepcion@gmv.com', 'recepcion', ORG_ID],
            ['seguridad@gmv.com', 'seguridad', ORG_ID],
            ['admin@gmv.com', 'administrador', ORG_ID],
        ];

        for (const [email, role, cid] of users) {
            await client.query(
                `INSERT INTO users (email, password_hash, role, company_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) DO NOTHING`,
                [email, passHash, role, cid]
            );
        }
        console.log('   ✅ 3 usuarios creados (todos con password: admin123)');

        // ──────────────────────────────────────────
        // 2. EMPRESAS VISITANTES
        // ──────────────────────────────────────────
        console.log('\n🏢 Creando empresas visitantes...');
        const visitorCompanies = [
            'Constructora Rodríguez & Asociados',
            'Distribuidora del Caribe SRL',
            'Tech Solutions Dominicana',
            'ASONAHORES',
            'Cervecería Nacional',
            'Grupo Rica',
            'CEPM Energía',
            'Claro Dominicana',
            'Banco Popular Dominicano',
            'DGII',
            'Edesur Dominicana',
            'AES Dominicana',
        ];

        const companyIds = [];
        for (const name of visitorCompanies) {
            const r = await client.query(
                `INSERT INTO visitor_companies (company_id, name)
                 VALUES ($1, $2) RETURNING id`,
                [ORG_ID, name]
            );
            companyIds.push(r.rows[0].id);
        }
        console.log(`   ✅ ${visitorCompanies.length} empresas visitantes creadas`);

        // ──────────────────────────────────────────
        // 3. EMPLEADOS
        // ──────────────────────────────────────────
        console.log('\n🧑‍💼 Creando empleados...');
        const employees = [
            ['Carlos Mesa Vásquez', 'Gerencia', 'carlos@gmv.com', '809-555-0001'],
            ['María Pérez Santos', 'Recursos Humanos', 'maria@gmv.com', '809-555-0002'],
            ['Juan Rodríguez Luna', 'Operaciones', 'juan@gmv.com', '809-555-0003'],
            ['Ana García Méndez', 'Contabilidad', 'ana@gmv.com', '809-555-0004'],
            ['Pedro Martínez Díaz', 'Tecnología', 'pedro@gmv.com', '809-555-0005'],
            ['Luisa Fernández Reyes', 'Ventas', 'luisa@gmv.com', '809-555-0006'],
            ['Roberto Sánchez Matos', 'Logística', 'roberto@gmv.com', '809-555-0007'],
            ['Carmen Jiménez Torres', 'Legal', 'carmen@gmv.com', '809-555-0008'],
            ['Miguel Hernández Cruz', 'Proyectos', 'miguel@gmv.com', '809-555-0009'],
            ['Sofía Castillo Gómez', 'Marketing', 'sofia@gmv.com', '809-555-0010'],
            ['Fernando Alvarado Peña', 'Mantenimiento', 'fernando@gmv.com', '809-555-0011'],
            ['Patricia Núñez Bautista', 'Calidad', 'patricia@gmv.com', '809-555-0012'],
        ];

        const employeeNames = [];
        for (const [name, area, email, whatsapp] of employees) {
            await client.query(
                `INSERT INTO employees (company_id, name, area, email, whatsapp)
                 VALUES ($1, $2, $3, $4, $5)`,
                [ORG_ID, name, area, email, whatsapp]
            );
            employeeNames.push(name);
        }
        console.log(`   ✅ ${employees.length} empleados creados`);

        // ──────────────────────────────────────────
        // 4. ÁREAS adicionales
        // ──────────────────────────────────────────
        console.log('\n📍 Creando áreas adicionales...');
        const newAreas = [
            ['Almacén', '1'],
            ['Comedor', '1'],
            ['Laboratorio', '3'],
            ['Sala de Conferencias', '2'],
            ['Parqueo', '1'],
            ['Terraza VIP', '3'],
        ];

        const areaIds = [];
        // Get existing areas
        const existingAreas = await client.query(
            'SELECT id FROM areas WHERE company_id = $1', [ORG_ID]
        );
        existingAreas.rows.forEach(r => areaIds.push(r.id));

        for (const [name, level] of newAreas) {
            const r = await client.query(
                `INSERT INTO areas (company_id, name, level)
                 VALUES ($1, $2, $3) RETURNING id`,
                [ORG_ID, name, level]
            );
            areaIds.push(r.rows[0].id);
        }
        console.log(`   ✅ ${newAreas.length} áreas nuevas creadas (total: ${areaIds.length})`);

        // ──────────────────────────────────────────
        // 5. CARNETS adicionales
        // ──────────────────────────────────────────
        console.log('\n🎫 Creando carnets adicionales...');
        const badges = ['006','007','008','009','010','011','012','013','014','015'];
        for (const num of badges) {
            await client.query(
                `INSERT INTO badges (company_id, number) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [ORG_ID, num]
            );
        }
        console.log(`   ✅ ${badges.length} carnets nuevos (total: 15)`);

        // ──────────────────────────────────────────
        // 6. MOTIVOS DE VISITA adicionales
        // ──────────────────────────────────────────
        console.log('\n📋 Creando motivos de visita adicionales...');
        const reasons = [
            'Auditoría',
            'Capacitación',
            'Servicio Técnico',
            'Consultoría',
            'Visita Comercial',
        ];
        for (const label of reasons) {
            await client.query(
                `INSERT INTO visit_reasons (company_id, label) VALUES ($1, $2)`,
                [ORG_ID, label]
            );
        }
        console.log(`   ✅ ${reasons.length} motivos nuevos`);

        // ──────────────────────────────────────────
        // 7. VISITAS — datos masivos realistas
        // ──────────────────────────────────────────
        console.log('\n🚶 Creando visitas de prueba...');

        const visitorsData = [
            // [nombre, cédula, empresa, motivo, teléfono, email]
            ['José Ramón Peralta', '001-1234567-8', 'Constructora Rodríguez & Asociados', 'Reunión', '809-222-0001', 'jose.peralta@email.com'],
            ['María Elena Guzmán', '002-9876543-2', 'Distribuidora del Caribe SRL', 'Entrega', '809-222-0002', 'maria.guzman@email.com'],
            ['Francisco Peña Batista', '003-4561237-9', 'Tech Solutions Dominicana', 'Servicio Técnico', '809-222-0003', 'francisco.pena@email.com'],
            ['Altagracia Rosario M.', '004-7891234-5', 'ASONAHORES', 'Visita Comercial', '809-222-0004', 'alta.rosario@email.com'],
            ['Ramón Emilio Jiménez', '005-3216549-1', 'Cervecería Nacional', 'Entrega', '809-222-0005', 'ramon.jimenez@email.com'],
            ['Yolanda Martínez Cruz', '006-6543217-8', 'Grupo Rica', 'Reunión', '809-222-0006', 'yolanda.martinez@email.com'],
            ['Héctor Luis Domínguez', '007-9871234-3', 'CEPM Energía', 'Mantenimiento', '809-222-0007', 'hector.dominguez@email.com'],
            ['Scarlet Almonte Reyes', '008-1237894-6', 'Claro Dominicana', 'Capacitación', '809-222-0008', 'scarlet.almonte@email.com'],
            ['Wellington Marte Díaz', '009-4567891-2', 'Banco Popular Dominicano', 'Auditoría', '809-222-0009', 'wellington.marte@email.com'],
            ['Raquel Sosa Peña', '010-7894561-9', 'DGII', 'Auditoría', '809-222-0010', 'raquel.sosa@email.com'],
            ['Danny Acosta Vargas', '011-1111111-1', 'Edesur Dominicana', 'Servicio Técnico', '809-222-0011', 'danny.acosta@email.com'],
            ['Luz Milagros Estévez', '012-2222222-2', 'AES Dominicana', 'Consultoría', '809-222-0012', 'luz.estevez@email.com'],
            ['Pablo Andrés Vega', '013-3333333-3', 'Tech Solutions Dominicana', 'Reunión', '809-222-0013', 'pablo.vega@email.com'],
            ['Génesis Brito Castillo', '014-4444444-4', 'Distribuidora del Caribe SRL', 'Entrevista', '809-222-0014', 'genesis.brito@email.com'],
            ['Darío Feliz Montero', '015-5555555-5', 'Constructora Rodríguez & Asociados', 'Mantenimiento', '809-222-0015', 'dario.feliz@email.com'],
        ];

        const badgeNumbers = ['001','002','003','004','005','006','007','008','009','010','011','012','013','014','015'];
        let visitCount = 0;

        // --- VISITAS DE HOY (activas - "En Planta") ---
        const now = new Date();
        const todayVisitors = visitorsData.slice(0, 5);
        for (let i = 0; i < todayVisitors.length; i++) {
            const [name, doc, company, reason, phone, email] = todayVisitors[i];
            const checkIn = new Date(now);
            checkIn.setHours(7 + i, Math.floor(Math.random() * 60), 0);

            await client.query(
                `INSERT INTO visits (company_id, full_name, document_id, company_name, reason, employee, badge_number, area_id, check_in, status, visitor_phone, visitor_email)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Ingresado',$10,$11)`,
                [ORG_ID, name, doc, company, reason, employeeNames[i % employeeNames.length], badgeNumbers[i], areaIds[i % areaIds.length], checkIn.toISOString(), phone, email]
            );
            visitCount++;
        }
        console.log(`   ✅ ${todayVisitors.length} visitas activas hoy (En Planta)`);

        // --- VISITAS DE HOY (ya salieron) ---
        const todayCompleted = visitorsData.slice(5, 8);
        for (let i = 0; i < todayCompleted.length; i++) {
            const [name, doc, company, reason, phone, email] = todayCompleted[i];
            const checkIn = new Date(now);
            checkIn.setHours(8 + i, Math.floor(Math.random() * 60), 0);
            const checkOut = new Date(checkIn);
            checkOut.setHours(checkIn.getHours() + 1 + Math.floor(Math.random() * 2));

            await client.query(
                `INSERT INTO visits (company_id, full_name, document_id, company_name, reason, employee, badge_number, area_id, check_in, check_out, status, visitor_phone, visitor_email)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Salida',$11,$12)`,
                [ORG_ID, name, doc, company, reason, employeeNames[(i + 5) % employeeNames.length], badgeNumbers[i + 5], areaIds[(i + 3) % areaIds.length], checkIn.toISOString(), checkOut.toISOString(), phone, email]
            );
            visitCount++;
        }
        console.log(`   ✅ ${todayCompleted.length} visitas completadas hoy (Salida)`);

        // --- VISITAS DE AYER ---
        for (let i = 0; i < 6; i++) {
            const v = visitorsData[(i + 8) % visitorsData.length];
            const [name, doc, company, reason, phone, email] = v;
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(8 + i, Math.floor(Math.random() * 60), 0);
            const checkOut = new Date(yesterday);
            checkOut.setHours(yesterday.getHours() + 2 + Math.floor(Math.random() * 3));

            await client.query(
                `INSERT INTO visits (company_id, full_name, document_id, company_name, reason, employee, badge_number, area_id, check_in, check_out, status, visitor_phone, visitor_email)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Salida',$11,$12)`,
                [ORG_ID, name, doc, company, reason, employeeNames[i % employeeNames.length], badgeNumbers[i], areaIds[i % areaIds.length], yesterday.toISOString(), checkOut.toISOString(), phone, email]
            );
            visitCount++;
        }
        console.log(`   ✅ 6 visitas de ayer`);

        // --- VISITAS DE LOS ÚLTIMOS 7 DÍAS ---
        for (let day = 2; day <= 7; day++) {
            const numVisits = 3 + Math.floor(Math.random() * 5); // 3-7 visitas por día
            for (let i = 0; i < numVisits; i++) {
                const v = visitorsData[(day * 3 + i) % visitorsData.length];
                const [name, doc, company, reason, phone, email] = v;
                const d = new Date(now);
                d.setDate(d.getDate() - day);
                d.setHours(7 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0);
                const co = new Date(d);
                co.setHours(d.getHours() + 1 + Math.floor(Math.random() * 4));

                await client.query(
                    `INSERT INTO visits (company_id, full_name, document_id, company_name, reason, employee, badge_number, area_id, check_in, check_out, status, visitor_phone, visitor_email)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Salida',$11,$12)`,
                    [ORG_ID, name, doc, company, reason, employeeNames[i % employeeNames.length], badgeNumbers[i % badgeNumbers.length], areaIds[i % areaIds.length], d.toISOString(), co.toISOString(), phone, email]
                );
                visitCount++;
            }
        }
        console.log(`   ✅ Visitas históricas (últimos 7 días)`);

        await client.query('COMMIT');

        // ──────────────────────────────────────────
        // RESUMEN FINAL
        // ──────────────────────────────────────────
        console.log('\n═══════════════════════════════════════');
        console.log('   📊 RESUMEN DE DATOS CARGADOS');
        console.log('═══════════════════════════════════════');

        const counts = await Promise.all([
            client.query('SELECT COUNT(*) as c FROM users'),
            client.query('SELECT COUNT(*) as c FROM employees'),
            client.query('SELECT COUNT(*) as c FROM visitor_companies'),
            client.query('SELECT COUNT(*) as c FROM areas'),
            client.query('SELECT COUNT(*) as c FROM badges'),
            client.query('SELECT COUNT(*) as c FROM visit_reasons'),
            client.query('SELECT COUNT(*) as c FROM visits'),
            client.query("SELECT COUNT(*) as c FROM visits WHERE status = 'Ingresado'"),
            client.query("SELECT COUNT(*) as c FROM visits WHERE DATE(check_in) = CURRENT_DATE"),
        ]);

        console.log(`   👤 Usuarios:            ${counts[0].rows[0].c}`);
        console.log(`   🧑‍💼 Empleados:           ${counts[1].rows[0].c}`);
        console.log(`   🏢 Empresas visitantes:  ${counts[2].rows[0].c}`);
        console.log(`   📍 Áreas:               ${counts[3].rows[0].c}`);
        console.log(`   🎫 Carnets:             ${counts[4].rows[0].c}`);
        console.log(`   📋 Motivos de visita:   ${counts[5].rows[0].c}`);
        console.log(`   🚶 Visitas totales:     ${counts[6].rows[0].c}`);
        console.log(`   🟢 En planta ahora:     ${counts[7].rows[0].c}`);
        console.log(`   📅 Visitas hoy:         ${counts[8].rows[0].c}`);
        console.log('═══════════════════════════════════════\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
