# Arquitectura Escalable para ERP (Next.js 16 + App Router)

La estructura del proyecto ha sido configurada utilizando el patrón **Feature-Sliced Design / Domain Driven**, el estándar de escalabilidad más alto recomendado para sistemas complejos (como tu ERP SaaS) en Next.js. 

En lugar de tener una sola carpeta gigante de `components`, dividimos por "Dominio de Negocio" (Features) para que el proyecto no colapse cuando alcance muchos módulos.

## Estructura de Carpetas

```plaintext
src/
├── actions/        # (Server Actions): Mutaciones puras de Next.js (Server-side) aisladas.
├── app/            # (Routing): Layouts, Pages y API Routes. Exclusivamente para enrutamiento.
├── components/     
│   ├── layout/     # App shell, Navbar, Sidebars dependientes de la empresa.
│   ├── shared/     # Componentes estables (buttons personalizados, modals, forms).
│   └── ui/         # Componentes core de diseño autogenerados por shadcn/ui.
├── features/       # (Módulos del ERP): Agrupamiento por dominio. 
│   ├── auth/       # Login, recuperación, registro y verificación de sesiones.
│   ├── sales/      # Punto de venta, UI de carrito, listado de comprobantes.
│   └── products/   # ABM de categoría, producto, stocks.
├── hooks/          # React hooks globales (use-toast, use-mobile, etc.).
├── store/          # Zustand / Context API globales (estado no persistido por URL).
├── types/          # Tipados TypeScript de base de datos extraídos / manuales.
└── lib/          
    ├── supabase/   # Clientes SSG/SSR/Browser de supabase/ssr injectados por shadcn.
    └── utils.ts    # merge (cn) de tailwind-merge y clsx.
```

### Reglas para Agentes de IA / Developers:
1. **Separación de Responsabilidades:** Un componente de interfaz en `sales` no debe consumir lógica en `auth`. En estos casos de cruce, usa components en `shared`.
2. **Server Actions First:** Prefiere server actions en `actions/` antes que crear end-points convencionales en `api/` a menos que sea una integración webhook externa.
3. **Data Fetching:** Se realiza como Server Component en `app/`, y se propaga como *prop* hacia el Client Component que reside en su respectivo `features/modulo`.
