-- ============================================================
-- Visitas Hub RD — PostgreSQL Schema
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ORGANIZACIONES (multi-tenant root)
-- ============================================================
CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    nit         VARCHAR(50),
    address     TEXT,
    phone       VARCHAR(50),
    email       VARCHAR(200),
    logo_url    TEXT,
    has_punto_de_control BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. USUARIOS (auth + roles)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(200) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(30) NOT NULL DEFAULT 'recepcion'
                    CHECK (role IN ('superadmin', 'administrador', 'recepcion', 'seguridad', 'punto_de_control')),
    company_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
    assigned_areas  JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);

-- ============================================================
-- 3. EMPRESAS VISITANTES
-- ============================================================
CREATE TABLE visitor_companies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitor_companies_org ON visitor_companies(company_id);

-- ============================================================
-- 4. MOTIVOS DE VISITA
-- ============================================================
CREATE TABLE visit_reasons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visit_reasons_org ON visit_reasons(company_id);

-- ============================================================
-- 5. CARNETS / BADGES
-- ============================================================
CREATE TABLE badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    number      VARCHAR(20) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, number)
);

CREATE INDEX idx_badges_org ON badges(company_id);

-- ============================================================
-- 6. EMPLEADOS
-- ============================================================
CREATE TABLE employees (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    area        VARCHAR(200),
    email       VARCHAR(200),
    whatsapp    VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_org ON employees(company_id);

-- ============================================================
-- 7. ÁREAS / NIVELES
-- ============================================================
CREATE TABLE areas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    level           VARCHAR(50) NOT NULL DEFAULT '1',
    parent_area_id  UUID REFERENCES areas(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_areas_org ON areas(company_id);

-- ============================================================
-- 8. VISITAS
-- ============================================================
CREATE TABLE visits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name       VARCHAR(300) NOT NULL,
    document_id     VARCHAR(50),
    company_name    VARCHAR(200),
    document_id_empresa VARCHAR(50),
    reason          VARCHAR(200),
    employee        VARCHAR(200),
    badge_number    VARCHAR(20),
    area_id         UUID REFERENCES areas(id) ON DELETE SET NULL,
    photo_url       TEXT,
    check_in        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out       TIMESTAMPTZ,
    status          VARCHAR(30) NOT NULL DEFAULT 'Ingresado'
                    CHECK (status IN ('Ingresado', 'Salida')),
    visitor_phone   VARCHAR(50),
    visitor_email   VARCHAR(200),
    access_method   VARCHAR(20) NOT NULL DEFAULT 'badge'
                    CHECK (access_method IN ('badge', 'ticket')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_org ON visits(company_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_checkin ON visits(check_in DESC);
CREATE INDEX idx_visits_org_checkin ON visits(company_id, check_in DESC);

-- ============================================================
-- Función para actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
