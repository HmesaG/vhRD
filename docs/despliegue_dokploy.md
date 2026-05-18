# 🚀 Manual de Despliegue Premium de Visitas Hub RD (vhRD) en Dokploy

Este manual proporciona una guía paso a paso y de alta precisión técnica para desplegar la suite completa de **Visitas Hub RD (vhRD)** en tu servidor utilizando **Dokploy**.

---

## 📐 Arquitectura de Producción

Para garantizar el máximo rendimiento, seguridad con SSL automático (Let's Encrypt) y escalabilidad, el despliegue se estructurará de la siguiente forma:

```mermaid
graph TD
    Client([💻 Cliente / Navegador]) -->|HTTPS (Puerto 443)| Traefik[🛡️ Proxy Traefik Dokploy]
    
    subgraph Dokploy [📦 Plataforma Dokploy]
        Traefik -->|Dominio Front| Frontend[React Nginx SPA - Puerto 80]
        Traefik -->|Dominio API| Backend[Express API Server - Puerto 3001]
        
        subgraph DatabaseOptions [🗄️ Opciones de Base de Datos]
            DB_Dokploy[(PostgreSQL Administrado Dokploy)]
            DB_External[(PostgreSQL Externo / Actual)]
        end
        
        Backend -->|Conectividad| DB_Dokploy
        Backend -->|Conectividad| DB_External
    end
```

---

## 🛠️ Método Recomendado: Aplicaciones Individuales (Nativo Dokploy)

Este método es el más robusto porque permite a Dokploy gestionar de forma visual los certificados SSL, redirecciones, logs independientes y backups periódicos para cada servicio.

### 📋 Requisitos Previos
* Repositorio de GitHub configurado: `https://github.com/HmesaG/vhRD.git` en la rama `main`.
* Acceso a tu panel de Dokploy.
* Ip del Servidor Dokploy (ej. `31.97.100.82`).

---

### Paso 1: Configurar la Base de Datos 🗄️

Tienes dos alternativas excelentes:

#### Opción A: Continuar usando la Base de Datos Externa (Actual)
Si deseas seguir usando tu base de datos de producción existente, no necesitas crear ninguna base de datos en Dokploy. Solo necesitarás su cadena de conexión en el Paso 2:
`postgres://postgres:zX9!nQ2pL_7tR4vB@31.97.100.82:8432/vhrd`

#### Opción B: Crear una Base de Datos PostgreSQL Administrada en Dokploy (Recomendada para autonomía total)
1. En tu panel de Dokploy, ve al proyecto deseado y haz clic en **Create Service** -> **Database** -> **PostgreSQL**.
2. Configura los siguientes parámetros:
   * **Name**: `vhrd-db`
   * **Version**: `16-alpine`
3. Haz clic en **Create**. Dokploy creará la base de datos y te proporcionará una **Internal Connection String** (URI de conexión interna) como:
   `postgresql://postgres:random-password@vhrd-db:5432/postgres`
4. *(Opcional)* Si quieres importar tus esquemas de base de datos actuales, puedes usar la herramienta integrada de Dokploy o conectarte externamente habilitando el acceso TCP externo en la configuración de la base de datos de Dokploy e importando los archivos schema.sql y seed.sql.

---

### Paso 2: Desplegar la API Backend (Express) 🧠

1. En el panel de Dokploy, ve a **Applications** -> **Create Application**.
2. Configura el origen del código:
   * **Provider**: GitHub (o Git Repository apuntando a `https://github.com/HmesaG/vhRD.git`)
   * **Branch**: `main`
3. En la sección **Build Configuration**:
   * **Build Type**: `Docker`
   * **Build Context**: `server` *(¡Muy Importante! Esto le dice a Dokploy que ejecute Docker dentro de la carpeta /server)*
   * **Dockerfile Path**: `Dockerfile` *(Dentro del contexto 'server', este es el archivo Dockerfile)*
4. En la sección **Network**:
   * **Port**: `3001` *(El puerto en el que escucha la API Express)*
5. En la sección **Environment Variables**, agrega:
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgres://postgres:zX9!nQ2pL_7tR4vB@31.97.100.82:8432/vhrd
   JWT_SECRET=tu-llave-super-secreta-vhrd-2026
   CORS_ORIGIN=https://vhrd.31.97.100.82.sslip.io
   ```
   > [!TIP]
   > Si elegiste la **Opción B** de la base de datos en Dokploy, reemplaza el valor de `DATABASE_URL` por la URI de conexión interna generada por Dokploy.
6. En la pestaña **Domains**, asigna un dominio a la API:
   * Si usas sslip.io: `api-vhrd.31.97.100.82.sslip.io`
   * Si usas tu propio dominio: `api.tudominio.com` (recuerda crear el registro CNAME o A en tu proveedor DNS apuntando a la IP del servidor).
7. Haz clic en **Deploy**. Dokploy compilará el backend, generará el certificado SSL y lo pondrá en marcha de forma segura.

---

### Paso 3: Desplegar el Frontend (React) 💻

El frontend de React se sirve estáticamente con Nginx en el puerto 80, pero requiere comunicarse con la API. ¡Buenas noticias! Ahora el sistema incluye un **RESOLVER DINÁMICO AUTO-CURABLE** en el cliente de red (`api.js`), lo que significa que **se configura solo de forma inteligente**.

1. En tu panel de Dokploy, ve a **Applications** -> **Create Application**.
2. Configura el origen del código:
   * **Provider**: GitHub (o Git Repository apuntando a `https://github.com/HmesaG/vhRD.git`)
   * **Branch**: `main`
3. En la sección **Build Configuration**:
   * **Build Type**: `Docker`
   * **Build Context**: `/` *(¡Muy Importante! Contexto en la raíz para permitir el acceso a toda la carpeta y nginx.conf)*
   * **Dockerfile Path**: `Dockerfile` *(El Dockerfile de la raíz)*
4. En la sección **Network**:
   * **Port**: `80` *(El puerto en el que escucha Nginx)*
5. **Configuración de la URL de la API (Dos opciones):**
   * **Opción Auto-Curable (Recomendada y Automática):** No necesitas configurar ninguna variable de entorno ni argumento de compilación en Dokploy. El frontend detectará automáticamente si está corriendo en localhost (y usará `http://localhost:3001`) o en producción (e inteligentemente deducirá el backend añadiendo el prefijo `api-` al dominio del navegador, ej: `vhrd.31.97.100.82.sslip.io` -> `api-vhrd.31.97.100.82.sslip.io`).
   * **Opción Explícita (Para dominios personalizados):** Si vas a utilizar dominios independientes personalizados sin el patrón estándar (ej: `www.misitio.com` y `backend.misitio.com`), puedes pasar la URL explícitamente agregando un **Build Arg** (¡no variable de entorno normal!) en Dokploy:
     * En Dokploy, ve a la pestaña **Build Configuration** -> **Build Args** e introduce:
       ```text
       VITE_API_URL=https://tu-api-personalizada.com
       ```
       > [!IMPORTANT]
       > Si usas esta opción, asegúrate de colocar el valor en **Build Args** (y no en Environment Variables) para que Vite pueda inyectarlo en el código durante el proceso de compilación (`docker build`).
6. En la pestaña **Domains**, asigna el dominio del frontend:
   * Si usas sslip.io: `vhrd.31.97.100.82.sslip.io`
   * Si usas tu propio dominio: `vhrd.tudominio.com`
7. Haz clic en **Deploy** (o **Redeploy**). Dokploy descargará el código actualizado de GitHub, compilará la aplicación con soporte para WebSockets estables y servirá el frontend de forma inmediata.

---

## 🛟 Resolución de Problemas Frecuentes

### 1. ⚠️ El DNS gratuito `.traefik.me` no resuelve (Error: `queryA ESERVFAIL`)
En Dokploy, el wildcard por defecto suele ser `.traefik.me`. Sin embargo, algunos proveedores de internet (especialmente en República Dominicana, como Claro o Altice) bloquean este servicio DNS o este falla constantemente a nivel global.
* **Solución**: Cambia inmediatamente el wildcard a **`.sslip.io`** (ej. `tu-app.IP.sslip.io`) en la configuración general de Dokploy, o utiliza un dominio propio configurando los registros A en Cloudflare o tu registrador de dominios favorito.

### 2. ⚠️ Error: `❌ Github Provider not found`
Este error ocurre cuando seleccionas "GitHub" como proveedor en Dokploy pero no has integrado previamente la "GitHub App" oficial en la sección de configuración de Dokploy.
* **Solución Inmediata (Sin configurar GitHub App)**: 
  1. En el formulario de creación de la aplicación, en lugar de seleccionar **GitHub**, selecciona la opción **Git** (o **Git Repository** / **Custom Git**).
  2. Pega la URL HTTPS pública de tu repositorio: `https://github.com/HmesaG/vhRD.git`
  3. Indica la rama `main` y guarda. Dokploy clonará el repositorio directamente como repositorio público sin necesidad de configuraciones globales ni llaves.
* **Solución Permanente (Si deseas autodepliegues automáticos al hacer push)**:
  1. Ve a **Settings** -> **Git Providers** en tu Dokploy.
  2. Haz clic en **GitHub** y sigue las instrucciones para enlazar tu cuenta y crear la GitHub App en tu perfil de GitHub.

### 3. ⚠️ Peticiones fallidas al Backend (CORS)
Si la app de React carga pero al intentar hacer Login o ver datos se queda cargando o da error en la consola del navegador:
* **Causa**: La variable `CORS_ORIGIN` en el Backend no coincide exactamente con el dominio del Frontend, o la API no está escuchando de forma segura.
* **Solución**: Verifica que:
  1. La variable `CORS_ORIGIN` en el Backend tenga el valor exacto del dominio del Frontend (ej: `https://vhrd.31.97.100.82.sslip.io` - ¡sin barra diagonal al final!).
  2. En el Frontend, la variable `VITE_API_URL` tenga la dirección HTTPS correcta del Backend.

---

## 🚀 ¡Listo!
Siguiendo esta estructura, tu aplicación **Visitas Hub RD (vhRD)** estará completamente desplegada en producción en Dokploy de forma segura, escalable y con certificados SSL autogestionados. Si necesitas ayuda con la importación inicial de los datos a la base de datos interna, avísame.

