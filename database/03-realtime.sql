-- ============================================================
-- Visitas Hub RD — Real-Time Triggers (LISTEN/NOTIFY)
-- ============================================================

-- Función genérica para enviar notificaciones JSON a un canal
CREATE OR REPLACE FUNCTION notify_table_change() RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', row_to_json(OLD)
    );
  ELSE
    payload = json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', row_to_json(NEW)
    );
  END IF;
  
  -- Publicar en el canal 'db_notifications'
  PERFORM pg_notify('db_notifications', payload::text);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Aplicar triggers a las tablas importantes para tiempo real
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS notify_visits_change ON visits;
CREATE TRIGGER notify_visits_change
  AFTER INSERT OR UPDATE OR DELETE ON visits
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

DROP TRIGGER IF EXISTS notify_users_change ON users;
CREATE TRIGGER notify_users_change
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();
  
DROP TRIGGER IF EXISTS notify_organizations_change ON organizations;
CREATE TRIGGER notify_organizations_change
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

DROP TRIGGER IF EXISTS notify_areas_change ON areas;
CREATE TRIGGER notify_areas_change
  AFTER INSERT OR UPDATE OR DELETE ON areas
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();
