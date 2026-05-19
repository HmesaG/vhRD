# 🏢 Visitas Hub RD v2.5.0 — Sistema Inteligente de Gestión y Control de Visitas

Visitas Hub RD es una solución de nivel corporativo desarrollada por **Grupo Mesa Vasquez (GMV)** para la automatización, seguridad y control de acceso de visitantes en entornos empresariales. Diseñado con una arquitectura multi-tenant y un robusto esquema de seguridad perimetral, el sistema permite registrar, rastrear e identificar visitas mediante credenciales físicas y digitales en tiempo real.

---

## 🚀 Funciones Reales del Sistema

### 1. Identidad Digital e Integración con Cédula & RNC
* **Búsqueda Automatizada:** Registro ágil mediante lectura o digitación de la Cédula Dominicana, extrayendo datos clave del visitante.
* **Consulta de RNC DGII:** Integración con la consulta oficial de contribuyentes de la Dirección General de Impuestos Internos (DGII) para validar y autocompletar la filiación de empresas externas y contratistas.
* **Empresa Independiente:** Opción rápida en el formulario para copiar automáticamente los datos personales del visitante como datos de su empresa (en caso de contratistas independientes o proveedores autónomos), evitando rellenar campos duplicados.
* **Captura de Fotografía:** Integración directa con cámaras web/dispositivos para capturar e imprimir la foto en vivo del visitante al momento de su ingreso.

### 2. Puntos de Control y Seguridad Zonal (Checkpoints)
* **Zonificación Física:** Terminales específicos asociados a áreas geográficas de la organización (Entradas principales, Almacenes, Oficinas de Dirección).
* **Verificación Dinámica:** Los agentes de seguridad validan instantáneamente los accesos escaneando el código QR o el carnet del visitante para autorizar o denegar su tránsito.

### 3. Tracking de Rutas en Tiempo Real
* **Monitoreo con WebSockets:** Conexión en tiempo real (Socket.io) para recibir notificaciones instantáneas de entradas y salidas en el Dashboard.
* **Bitácora Cronológica:** Historial visualizado de la ruta exacta que ha recorrido el visitante por los diferentes checkpoints dentro de las instalaciones.

### 4. Carnets & Credenciales QR Físicos
* **Pases con Códigos QR:** Generación automatizada de identificadores QR únicos para cada visita.
* **Impresión Térmica:** Formato optimizado para imprimir tickets o etiquetas físicas (58mm/80mm) con código de barras de respaldo, datos principales, foto y logotipos de la organización.

### 5. Directorios y Catálogos Corporativos
* **Empleados Receptores:** Gestión de la base de datos de empleados anfitriones asociados a sus respectivas áreas de trabajo.
* **Empresas Externas:** Catálogo de contratistas, proveedores y empresas terceras recurrentes.
* **Motivos de Visita:** Parametrización estandarizada de las causas de ingreso para análisis operativo.

### 6. Control Multi-Tenant e Isolation
* **Segregación Total:** Soporte para múltiples organizaciones en un solo servidor. Cada organización posee sus propios usuarios, visitantes, empleados, áreas y estadísticas de forma aislada.
* **Módulo Superadmin:** Gestión global de licencias, organizaciones activas y capacidades del sistema.

### 7. Roles y Permisos Granulares
* **Superadmin:** Control total del ecosistema multi-tenant.
* **Administrador:** Gestión de catálogos, usuarios, reportes y configuración de áreas de su respectiva organización.
* **Recepción:** Registro de nuevas visitas, captura de fotos e impresión de carnets.
* **Seguridad:** Monitoreo dinámico del listado de visitas e ingresos generales.
* **Punto de Control:** Terminal simplificada para escaneo rápido de pases.

### 8. Dashboard y Reportes Avanzados
* **Métricas Clave:** Panel interactivo con conteo de visitas activas, ingresos de hoy, y gráficos de tendencias de flujo peatonal.
* **Módulo de Reportes:** Generación de informes exportables filtrados por fechas, estados, empresas, áreas y motivos de visita.

### 9. Soporte Express WhatsApp por GMV
* **Mesa de Ayuda Directa:** Botón flotante integrado que compila automáticamente la información del usuario en sesión y el caso técnico, generando una plantilla lista para enviar a la línea directa de asistencia de **Grupo Mesa Vasquez**.

---

## 🛠️ Stack Tecnológico

El sistema ha sido estructurado con tecnologías modernas de alta velocidad y robustez:

* **Frontend:**
  * **React 19 & Vite** para una interfaz ágil (SPA) de alta fidelidad.
  * **Tailwind CSS** para un diseño moderno, responsive y adaptable a Dark/Light Mode.
  * **Socket.io-Client** para la reactividad en tiempo real.
  * **Html5-QRCode** para lectura y escaneo de credenciales desde cámaras o lectores de códigos.
  * **Chart.js** & **React-Chartjs-2** para analíticas de flujos en el Dashboard.
  * **Tom-Select** para campos de búsqueda predictiva en catálogos extensos.

* **Backend (API REST):**
  * **Node.js** con **Express.js** estructurado con controladores y rutas escalables.
  * **Socket.io** para emitir eventos de tiempo real en red perimetral.
  * **JWT (JSON Web Tokens)** para una autenticación stateless segura.
  * **Bcrypt.js** para el hash seguro de contraseñas.
  * **Helmet** para mitigar ataques HTTP comunes a nivel de cabeceras.

* **Base de Datos:**
  * **PostgreSQL 16 (Alpine)** con tablas optimizadas, índices para búsquedas por cédula y disparadores para notificaciones automáticas.

* **Infraestructura:**
  * **Docker** & **Docker Compose** para la orquestación e inicialización uniforme del entorno de desarrollo y producción.
  * **Nginx** para el enrutamiento de peticiones y balanceo de carga.

---

## 📂 Estructura del Proyecto

El repositorio está organizado de la siguiente manera:

```text
SistemaVisitasLocal/
├── VisitFlow-React/           # Código fuente del Frontend (Vite + React 19)
│   ├── src/
│   │   ├── components/        # Componentes reutilizables (Layout, Sidebar, Modal...)
│   │   ├── context/           # Contexto de Autenticación y datos globales
│   │   ├── pages/             # Páginas principales del sistema (Dashboard, Seguridad, Acerca de...)
│   │   ├── services/          # Conectores y peticiones HTTP al Backend API
│   │   └── index.css          # Estilos base y tokens CSS del sistema
├── server/                    # Código fuente del Backend (Node.js API)
│   ├── config/                # Ajustes de conexión a PostgreSQL
│   ├── controllers/           # Lógica y procesamiento de datos por módulo
│   ├── middleware/            # Filtros de autenticación por JWT y validación de roles
│   ├── routes/                # Enrutador de llamadas de la API REST
│   └── index.js               # Punto de entrada de la aplicación API + Sockets
├── database/                  # Scripts SQL de inicialización y datos de prueba
│   ├── schema.sql             # Estructura del esquema relacional
│   ├── seed.sql               # Datos iniciales para pruebas operativas
│   └── 03-realtime.sql        # Triggers relacionales y optimización
├── docker-compose.yml         # Orquestación de contenedores (Frontend, API, Postgres)
├── nginx.conf                 # Configuración del servidor Nginx
└── README.md                  # Este documento informativo
```

---

## ⚙️ Inicialización y Ejecución Local

### Opción Rápida con Docker (Recomendado)

Asegúrate de tener instalados **Docker** y **Docker Compose** en tu equipo. Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up --build -d
```

Este comando descargará e inicializará:
1. La base de datos en PostgreSQL 16 (puerto 5432).
2. El servidor Backend API (puerto 3001).
3. El frontend de React (puerto 80 o el puerto expuesto de Nginx).

---

### Opción Manual en Desarrollo

#### 1. Requisitos Previos
* Instalar **Node.js** (v18 o superior).
* Instalar **PostgreSQL 16** con una base de datos llamada `vhrd`.

#### 2. Configuración del Backend
1. Navega al directorio del servidor:
   ```bash
   cd server
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno creando un archivo `.env`:
   ```env
   PORT=3001
   DATABASE_URL=postgres://tu_usuario:tu_password@localhost:5432/vhrd
   JWT_SECRET=tu_clave_secreta_jwt
   CORS_ORIGIN=http://localhost:5181
   ```
4. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

#### 3. Configuración del Frontend
1. Navega al directorio del frontend:
   ```bash
   cd ../VisitFlow-React
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta la interfaz de desarrollo en Vite (que corre en el puerto configurado `5181` en local):
   ```bash
   npm run dev
   ```

---

## 🛡️ Propiedad Intelectual y Soporte

Visitas Hub RD es un producto registrado y de propiedad intelectual de **Grupo Mesa Vasquez (GMV)**. 

Para solicitudes comerciales, soporte técnico, integraciones personalizadas con hardware de control de accesos (molinetes, lectores biométricos) o consultas adicionales, puedes contactar al equipo técnico a través de los canales oficiales:

* 📞 **Teléfono de Soporte:** 829-936-9811
* 📧 **Correo Principal:** [grupomv.rd@outlook.com](mailto:grupomv.rd@outlook.com)
* 📧 **Correo Alternativo:** [grupomv.rd@gmail.com](mailto:grupomv.rd@gmail.com)
* 🌐 **Sitio Web Oficial:** [www.grupomvrd.com](https://www.grupomvrd.com)
* 📷 **Instagram:** [@grupomesavasquez](https://www.instagram.com/grupomesavasquez)
* 📘 **Facebook:** [Grupo Mesa Vasquez](https://www.facebook.com/people/Grupo-Mesa-Vasquez/pfbid0U7gxNN1qzzjXHCZdanc3vRUV3PMWtALnXdUSbz3BLpYkr1t7yh9Lso2FViwhdKqSl/)
* 💼 **LinkedIn:** [Grupo Mesa Vasquez](https://www.linkedin.com/company/grupo-mesa-vasquez/)

---
Desarrollado con excelencia técnica por **GMV** para brindar máxima integridad y velocidad a cada acceso.
