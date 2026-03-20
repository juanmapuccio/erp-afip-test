# ERP NodoSur — Sistema de Gestión y Facturación Electrónica

Un ERP moderno diseñado con **Next.js 15**, **Supabase** y **Tailwind CSS**, enfocado en la simplicidad y el cumplimiento fiscal argentino (AFIP/ARCA).

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=flat-square&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue?style=flat-square&logo=tailwind-css)
![AFIP](https://img.shields.io/badge/AFIP-Factura_Electrónica-blue?style=flat-square)

## 🚀 Características Principales

- **Dashboard de Ventas (Facturación)**: Gestión en tiempo real de transacciones.
- **Integración AFIP (vía SDK)**: Solicitud automática de CAE para Facturas A, B y C.
- **Impresión Profesional**: Comprobantes optimizados para hoja A4 con QR reglamentario.
- **Arquitectura FSD**: Código organizado por funcionalidades (`Feature-Sliced Design`).
- **Seguridad**: Server Actions para proteger credenciales y lógica sensible.

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 (App Router), React 19, Lucide React.
- **Estado/Backend**: Supabase (PostgreSQL, Auth, RLS).
- **Fiscal**: `@afipsdk/afip.js` para conexión con Web Services AFIP.
- **Estilos**: Tailwind CSS 4 con micro-animaciones dinámicas.

## 📋 Requisitos Previos

- **Node.js**: v18.x o superior.
- **Cuenta Supabase**: Para la base de datos y autenticación.
- **Acceso AFIP (Sandbox)**: Access Token obtenido en `app.afipsdk.com`.

## ⚙️ Instalación

Sigue estos pasos para poner en marcha el proyecto localmente:

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/erp-nodosur.git
   cd erp-nodosur
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:
   Crea un archivo `.env.local` en la raíz con el siguiente contenido:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

   # AFIP / ARCA
   AFIP_ACCESS_TOKEN=tu_access_token_de_afipsdk
   AFIP_TEST_CUIT=20409378472 # CUIT de prueba
   AFIP_ENV=sandbox # O 'production' cuando estés listo
   ```

4. **Ejecuta el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

## 📂 Estructura del Proyecto

```text
src/
├── actions/             # Server Actions (AFIP, Sales, etc.)
├── app/                # Rutas de Next.js (Dashboard, Login)
├── components/         # UI compartida (Buttons, Sidebar)
├── features/           # Lógica compleja (SalesList, PrintModal)
├── lib/
│   └── afip/           # Integración técnica con AFIP SDK
└── services/           # Clientes de API y Supabase
```

## 🚀 Despliegue en GitHub

Para subir este proyecto a GitHub:

1. Crea un repositorio vacío en GitHub.
2. Vincula tu carpeta local:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ERP NodoSur with AFIP integration"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/erp-nodosur.git
   git push -u origin main
   ```

---
Diseñado con ❤️ por **Antigravity AI** para **Nodo Sur**.
