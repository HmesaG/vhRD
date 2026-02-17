# Configuración de Firebase para VisitFlow

## Estado Actual de Firebase

**Proyecto:** flutterapp-ba14b (flutterApp)
**Usuario autenticado:** hmesag@gmail.com
**Colecciones existentes:** config, visit_reasons

## Estructura de Datos Requerida

### 1. Colección: `organizations`
Esta colección almacena las empresas/organizaciones que usan el sistema.

**Estructura de documento:**
```json
{
  "name": "Nombre de la Empresa",
  "nit": "123456789",
  "address": "Dirección de la empresa",
  "phone": "+57 300 123 4567",
  "email": "contacto@empresa.com",
  "logo_url": "https://ejemplo.com/logo.png",
  "createdAt": "timestamp"
}
```

**Ejemplo de documento inicial:**
- Document ID: (auto-generado, ej: "org_001")
- Campos:
  ```json
  {
    "name": "GMV",
    "nit": "900123456",
    "address": "Calle Principal 123",
    "phone": "+57 300 123 4567",
    "email": "info@gmv.com",
    "logo_url": "",
    "createdAt": "2026-02-15T20:00:00Z"
  }
  ```

### 2. Colección: `users`
Esta colección vincula los UIDs de Firebase Auth con roles y empresas.

**Estructura de documento:**
```json
{
  "email": "usuario@ejemplo.com",
  "role": "superadmin | administrador | recepcion | seguridad",
  "companyId": "org_001",
  "updatedAt": "timestamp"
}
```

**Ejemplo de documento inicial (superadmin):**
- Document ID: (UID del usuario de Firebase Auth)
- Campos:
  ```json
  {
    "email": "hmesag@gmail.com",
    "role": "superadmin",
    "companyId": "org_001",
    "updatedAt": "2026-02-15T20:00:00Z"
  }
  ```

### 3. Colección: `visits`
Registros de visitas (se crean desde la aplicación).

**Estructura de documento:**
```json
{
  "companyId": "org_001",
  "full_name": "Juan Pérez",
  "id_number": "123456789",
  "company": "Empresa Visitante",
  "reason": "Reunión",
  "employee": "Carlos López",
  "badge_number": "001",
  "photo_url": "data:image/jpeg;base64,...",
  "check_in": "timestamp",
  "check_out": "timestamp | null",
  "status": "Ingresado | Salida",
  "visitor_phone": "+57 300 123 4567",
  "visitor_email": "juan@empresa.com"
}
```

### 4. Colección: `companies`
Empresas visitantes (se crean desde la aplicación).

**Estructura de documento:**
```json
{
  "companyId": "org_001",
  "name": "Nombre de la Empresa Visitante"
}
```

### 5. Colección: `reasons`
Motivos de visita (se crean desde la aplicación).

**Estructura de documento:**
```json
{
  "companyId": "org_001",
  "label": "Reunión",
  "requiresBadge": true
}
```

### 6. Colección: `badges`
Carnets disponibles (se crean desde la aplicación).

**Estructura de documento:**
```json
{
  "companyId": "org_001",
  "number": "001"
}
```

### 7. Colección: `employees`
Empleados de la organización (se crean desde la aplicación).

**Estructura de documento:**
```json
{
  "companyId": "org_001",
  "name": "Carlos López",
  "area": "Sistemas",
  "email": "carlos@empresa.com",
  "whatsapp": "+57 300 123 4567"
}
```

## Pasos para Configurar Firebase

### Paso 1: Crear Usuario en Firebase Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto: **flutterapp-ba14b**
3. Ve a **Authentication** → **Users**
4. Click en **Add User**
5. Ingresa:
   - Email: `hmesag@gmail.com` (o el email que prefieras)
   - Password: (elige una contraseña segura)
6. Copia el **UID** del usuario creado (lo necesitarás para el siguiente paso)

### Paso 2: Crear la Primera Organización en Firestore

1. Ve a **Firestore Database**
2. Click en **Start collection**
3. Collection ID: `organizations`
4. Document ID: (auto-generado o escribe `org_001`)
5. Campos:
   ```
   name (string): "GMV"
   nit (string): "900123456"
   address (string): "Calle Principal 123"
   phone (string): "+57 300 123 4567"
   email (string): "info@gmv.com"
   logo_url (string): ""
   ```
6. Click en **Save**
7. **Copia el Document ID** (lo necesitarás para el siguiente paso)

### Paso 3: Vincular Usuario con Organización

1. En Firestore, click en **Start collection**
2. Collection ID: `users`
3. Document ID: **[PEGA AQUÍ EL UID DEL PASO 1]**
4. Campos:
   ```
   email (string): "hmesag@gmail.com"
   role (string): "superadmin"
   companyId (string): [PEGA AQUÍ EL DOCUMENT ID DEL PASO 2]
   ```
5. Click en **Save**

### Paso 4: Iniciar Sesión en la Aplicación

1. Abre la aplicación: http://localhost:5178/
2. Inicia sesión con el email y contraseña del Paso 1
3. Deberías ver el Dashboard con acceso completo

### Paso 5: Crear Datos Iniciales desde la Aplicación

Una vez dentro de la aplicación:

1. **Crear Motivos de Visita** (menú "Motivos")
   - Reunión
   - Entrega
   - Mantenimiento
   - etc.

2. **Crear Empresas Visitantes** (menú "Empresas")
   - Proveedores habituales
   - Clientes frecuentes

3. **Crear Empleados** (menú "Empleados")
   - Personal que recibe visitas

4. **Crear Carnets** (menú "Carnets")
   - Generar números de carnet (001-050, por ejemplo)

5. **Crear Usuarios Adicionales** (menú "Usuarios")
   - Primero crea el usuario en Firebase Auth
   - Luego vincúlalo desde esta sección

## Reglas de Seguridad de Firestore (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to get user data
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Helper function to check user role
    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }
    
    // Helper function to check if user belongs to company
    function belongsToCompany(companyId) {
      return isAuthenticated() && getUserData().companyId == companyId;
    }
    
    // Organizations - only superadmin can manage
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('superadmin');
    }
    
    // Users - only admins and superadmins can manage
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('superadmin') || hasRole('administrador');
    }
    
    // Visits - users can only access their company's data
    match /visits/{visitId} {
      allow read: if isAuthenticated() && belongsToCompany(resource.data.companyId);
      allow create: if isAuthenticated() && belongsToCompany(request.resource.data.companyId);
      allow update, delete: if isAuthenticated() && belongsToCompany(resource.data.companyId);
    }
    
    // Companies, Reasons, Badges, Employees - same pattern
    match /companies/{companyId} {
      allow read, write: if isAuthenticated() && belongsToCompany(resource.data.companyId);
    }
    
    match /reasons/{reasonId} {
      allow read, write: if isAuthenticated() && belongsToCompany(resource.data.companyId);
    }
    
    match /badges/{badgeId} {
      allow read, write: if isAuthenticated() && belongsToCompany(resource.data.companyId);
    }
    
    match /employees/{employeeId} {
      allow read, write: if isAuthenticated() && belongsToCompany(resource.data.companyId);
    }
  }
}
```

## Notas Importantes

1. **Multi-Empresa**: Cada registro debe tener un `companyId` que lo vincule a una organización.
2. **Roles**:
   - `superadmin`: Acceso total, puede gestionar organizaciones y usuarios
   - `administrador`: Gestión completa dentro de su empresa
   - `recepcion`: Registro de visitas y consultas
   - `seguridad`: Similar a recepción

3. **Logos**: Puedes usar URLs de servicios como:
   - Imgur
   - Firebase Storage
   - Cloudinary
   - O cualquier URL pública de imagen

4. **Primer Usuario**: El primer usuario DEBE ser creado manualmente en Firebase Console y Firestore.

## Solución de Problemas

### Pantalla en Blanco
- Verifica la consola del navegador (F12)
- Asegúrate de que Firebase esté correctamente inicializado
- Verifica que el usuario tenga un documento en la colección `users`

### No Puedo Ver Datos
- Verifica que el `companyId` del usuario coincida con el `companyId` de los datos
- Revisa las reglas de seguridad de Firestore
- Verifica que el usuario tenga el rol correcto

### Error de Autenticación
- Verifica que el email y contraseña sean correctos
- Asegúrate de que el usuario exista en Firebase Authentication
- Verifica que el usuario tenga un documento en la colección `users`
