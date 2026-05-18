# 💻 Visitas Hub RD — Frontend Client (React + Vite)

Este es el cliente web de **Visitas Hub RD**, una Single Page Application (SPA) moderna, rápida y altamente interactiva, diseñada para optimizar los flujos de gestión de accesos corporativos. Construida con **React 19**, **Vite** y **Tailwind CSS**, la interfaz ofrece una experiencia premium con micro-animaciones, soporte nativo de modo oscuro (Dark Mode), y diseño adaptativo enfocado a dispositivos móviles y de escritorio.

---

## 🛠️ Stack del Cliente y Dependencias Clave

El frontend aprovecha un conjunto seleccionado de librerías modernas para brindar alta interactividad y soporte técnico robusto:

1. **React 19 & React Router DOM v7:** Motor principal y enrutamiento dinámico basado en roles del usuario.
2. **Tailwind CSS:** Framework de estilos utilitarios con customización de colores corporativos (colores primarios, navy, fondos optimizados para modo oscuro).
3. **Socket.io-Client (v4):** Cliente de WebSockets para la actualización reactiva en tiempo real del Dashboard al registrarse ingresos o salidas de visitantes.
4. **Html5-QRCode (v2.3):** Integración nativa de la cámara para el escaneo directo de credenciales QR y códigos de barras (Cédula de Identidad).
5. **Chart.js & React-Chartjs-2:** Biblioteca gráfica para la representación de analíticas, estadísticas de visitas y horas de mayor tránsito en tiempo real.
6. **Tom-Select (v2.5):** Reemplazo avanzado para elementos `<select>` tradicionales, permitiendo búsquedas predictivas rápidas de empleados, motivos de visita y empresas en listas de gran escala.
7. **Lucide-React:** Set de iconos limpios, estéticos y consistentes a lo largo de toda la interfaz.
8. **Vite-Plugin-PWA:** Configuración de Progressive Web App (PWA) para permitir la instalación de la aplicación en dispositivos móviles y de escritorio como aplicación nativa.

---

## 📂 Estructura de Carpetas del Frontend

El código fuente del cliente se ubica en el directorio `src/` y está dividido lógicamente para facilitar la mantenibilidad y modularidad:

* 📁 **`src/assets/`**: Recursos estáticos como logotipos (`logo.png`), imágenes corporativas y vectores de diseño.
* 📁 **`src/components/`**: Componentes visuales y lógicos reutilizables a nivel global:
  * `Layout.jsx`: Contenedor principal que dibuja la barra lateral (Sidebar) de navegación adaptativa, la cabecera con el botón de "Nueva Visita", el selector de modo oscuro y el botón de soporte WhatsApp.
  * `DataTable.jsx`: Tabla parametrizada con capacidades de ordenamiento para visualizar listas.
  * `Pagination.jsx`: Componente de control de páginas para navegación de registros.
  * `VisitModal.jsx`: Modal inteligente y dinámico de registro de visitas con soporte de cámara en vivo para fotos, autocompletado y validación de campos.
  * `ProtectedRoute.jsx`: Componente wrapper que verifica si el usuario está autenticado y si cuenta con el rol requerido para ver una página específica.
  * `SplashScreen.jsx`: Pantalla de carga animada que se muestra durante la validación del estado de sesión inicial.
* 📁 **`src/context/`**: Manejadores de estado global:
  * `AuthContext.jsx`: Coordina el estado de inicio de sesión, almacenamiento y decodificación del JWT, detalles del inquilino (tenant/organización) y el control de cierre de sesión.
* 📁 **`src/hooks/`**: Custom React Hooks para la encapsulación de lógica reutilizable de llamadas a APIs, estados locales o detección de preferencias de sistema.
* 📁 **`src/pages/`**: Vistas completas del sistema mapeadas por el enrutador:
  * `Dashboard.jsx`: Panel estadístico principal con tarjetas de métricas en tiempo real y gráficos dinámicos de afluencia de personas.
  * `VisitsList.jsx`: Tabla operativa del listado general de visitas con filtros de búsqueda y opciones de check-out o reimpresión de pases.
  * `SecurityPanel.jsx`: Interfaz dedicada para el escaneo rápido de pases QR o manual por cédula en puntos de acceso.
  * `VisitorTracking.jsx`: Línea de tiempo interactiva que dibuja la ruta seguida por un visitante dentro de las instalaciones.
  * `Employees.jsx`, `Companies.jsx`, `AreasManagement.jsx`, `VisitReasons.jsx`, `UserManagement.jsx`, `OrganizationManagement.jsx`: Páginas de administración de catálogos y configuraciones según el rol del usuario.
  * `About.jsx`: Módulo "Acerca de" que detalla las especificaciones del sistema, arquitectura tecnológica e información corporativa de **Grupo Mesa Vasquez**.
  * `Login.jsx`: Pantalla de inicio de sesión estilizada con controles de seguridad.
* 📁 **`src/services/`**: Módulos de comunicación externa:
  * Conectores y peticiones HTTP (`fetch` / `axios` similares) estructurados para interactuar de forma ordenada con el Backend API REST.
* 📄 **`src/index.css`**: Archivo de estilos de entrada que integra Tailwind, define la tipografía predeterminada (`Outfit` / `Inter`), animaciones de escaneo y estilos específicos para la impresión térmica de carnets.

---

## 🚀 Comandos de Desarrollo y Producción

Ejecuta estos comandos desde la carpeta `VisitFlow-React`:

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar entorno local de desarrollo
Inicia el servidor local de desarrollo con soporte para recarga en caliente (HMR).
```bash
npm run dev
```
*Por defecto corre en el puerto `5181` según la configuración del proyecto local.*

### 3. Compilar aplicación para producción
Optimiza el código, minimiza recursos y genera la versión final lista para desplegar en el directorio `dist/`.
```bash
npm run build
```

### 4. Vista previa de la compilación de producción
Prueba localmente el paquete generado en `dist/` antes de subirlo al servidor definitivo.
```bash
npm run preview
```

---

## 🎨 Personalización de Estilos e Impresión de Carnets

* **Impresión Térmica:** La aplicación incluye clases CSS `@media print` optimizadas en `index.css` para el renderizado e impresión directa de carnets de visitantes de 100mm x 48mm sin márgenes. Oculta automáticamente los elementos de la interfaz de usuario (como el menú y el fondo) y centra el carnet con su código QR para una salida en impresora térmica instantánea.
* **Modo Oscuro:** Los componentes reaccionan dinámicamente al valor guardado en `localStorage` o a las preferencias del sistema utilizando la clase `dark` inyectada en el nodo `<html>`.

---
Desarrollado y mantenido con estándares de calidad premium por **Grupo Mesa Vasquez (GMV)**.
