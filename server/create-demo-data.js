import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const passwordHash = await bcrypt.hash('demo12345', 10);

    // 1. Empresa Demo
    console.log('Creating Empresa Demo...');
    const empRes = await client.query(
      `INSERT INTO organizations (name, nit, address, phone) 
       VALUES ('Empresa Demo S.A.', '100000001', 'Av. Central 123', '809-555-0001') 
       RETURNING id`
    );
    const empId = empRes.rows[0].id;

    await client.query(
      `INSERT INTO users (email, password_hash, role, company_id) 
       VALUES ('demo1', $1, 'superadmin', $2)`,
      [passwordHash, empId]
    );

    // Seed Data for Empresa
    const empAreas = ['Recepción', 'Sala de Reuniones A', 'Despacho Gerencia', 'TI', 'Recursos Humanos'];
    for (let i = 0; i < 5; i++) {
        const areaRes = await client.query(`INSERT INTO areas (company_id, name, level) VALUES ($1, $2, 'Nivel 1') RETURNING id`, [empId, empAreas[i]]);
        await client.query(`INSERT INTO employees (company_id, name, area, email) VALUES ($1, $2, $3, $4)`, [empId, `Empleado Empresa ${i+1}`, empAreas[i], `emp${i+1}@empresademo.com`]);
        await client.query(`INSERT INTO badges (company_id, number) VALUES ($1, $2)`, [empId, `EMP-${100+i}`]);
        await client.query(`INSERT INTO visit_reasons (company_id, label) VALUES ($1, $2)`, [empId, `Motivo Empresa ${i+1}`]);
    }

    // 2. Torre Residencial Demo
    console.log('Creating Torre Residencial Demo...');
    const resRes = await client.query(
      `INSERT INTO organizations (name, nit, address, phone) 
       VALUES ('Torre Residencial Demo', '200000002', 'Calle Residencial 456', '809-555-0002') 
       RETURNING id`
    );
    const resId = resRes.rows[0].id;

    await client.query(
      `INSERT INTO users (email, password_hash, role, company_id) 
       VALUES ('demo2', $1, 'superadmin', $2)`,
      [passwordHash, resId]
    );

    // Seed Data for Residencial
    const resAreas = ['Lobby', 'Apartamento 1A', 'Apartamento 2B', 'Área Social', 'Gimnasio'];
    for (let i = 0; i < 5; i++) {
        const areaRes = await client.query(`INSERT INTO areas (company_id, name, level) VALUES ($1, $2, 'Nivel ${i+1}') RETURNING id`, [resId, resAreas[i]]);
        await client.query(`INSERT INTO employees (company_id, name, area, email) VALUES ($1, $2, $3, $4)`, [resId, `Residente Torre ${i+1}`, resAreas[i], `residente${i+1}@residencialdemo.com`]);
        await client.query(`INSERT INTO badges (company_id, number) VALUES ($1, $2)`, [resId, `RES-${100+i}`]);
        await client.query(`INSERT INTO visit_reasons (company_id, label) VALUES ($1, $2)`, [resId, `Motivo Torre ${i+1}`]);
    }

    // Insert 5 visits for each
    console.log('Creating Visits...');
    for (let i = 0; i < 5; i++) {
        await client.query(
            `INSERT INTO visits (company_id, full_name, document_id, reason, employee, access_method, status) 
             VALUES ($1, $2, $3, $4, $5, 'ticket', 'Ingresado')`,
            [empId, `Visitante Empresa ${i+1}`, `0010000000${i}`, `Motivo Empresa ${i+1}`, `Empleado Empresa ${i+1}`]
        );

        await client.query(
            `INSERT INTO visits (company_id, full_name, document_id, reason, employee, access_method, status) 
             VALUES ($1, $2, $3, $4, $5, 'ticket', 'Ingresado')`,
            [resId, `Visitante Torre ${i+1}`, `0010000001${i}`, `Motivo Torre ${i+1}`, `Residente Torre ${i+1}`]
        );
    }

    console.log('Demo data created successfully!');
    console.log('Users:');
    console.log('- demo1 / demo12345');
    console.log('- demo2 / demo12345');

  } catch (err) {
    console.error('Error creating demo data:', err);
  } finally {
    await client.end();
  }
}

seed();
