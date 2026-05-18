-- ============================================================
-- Visitas Hub RD — Datos Iniciales (Seed)
-- ============================================================

-- Organización inicial: GMV
INSERT INTO organizations (id, name, nit, address, phone, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'GMV',
    '900123456',
    'Calle Principal 123',
    '+1 809 764 9811',
    'info@gmv.com'
) ON CONFLICT (id) DO NOTHING;

-- Usuario admin inicial
-- Password: Admin2026!  (bcrypt hash with 10 rounds)
-- To generate: node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('Admin2026!',10).then(h=>console.log(h))"
INSERT INTO users (id, email, password_hash, role, company_id)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'hmesag@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'superadmin',
    'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Motivos de visita ejemplo
INSERT INTO visit_reasons (company_id, label) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Reunión'),
    ('a0000000-0000-0000-0000-000000000001', 'Entrega'),
    ('a0000000-0000-0000-0000-000000000001', 'Mantenimiento'),
    ('a0000000-0000-0000-0000-000000000001', 'Entrevista')
ON CONFLICT DO NOTHING;

-- Áreas ejemplo
INSERT INTO areas (company_id, name, level) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Recepción', '1'),
    ('a0000000-0000-0000-0000-000000000001', 'Oficinas', '2'),
    ('a0000000-0000-0000-0000-000000000001', 'Sala de Reuniones', '2'),
    ('a0000000-0000-0000-0000-000000000001', 'Área Técnica', '3')
ON CONFLICT DO NOTHING;

-- Carnets ejemplo
INSERT INTO badges (company_id, number) VALUES
    ('a0000000-0000-0000-0000-000000000001', '001'),
    ('a0000000-0000-0000-0000-000000000001', '002'),
    ('a0000000-0000-0000-0000-000000000001', '003'),
    ('a0000000-0000-0000-0000-000000000001', '004'),
    ('a0000000-0000-0000-0000-000000000001', '005')
ON CONFLICT DO NOTHING;
