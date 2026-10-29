# Arquitectura

PWA modular: React + TypeScript estricto + Vite. Capas: presentación (UI), aplicación (casos de uso), dominio (reglas puras) e infraestructura (adaptadores Supabase). La UI no contiene fórmulas ni SQL; el dominio no importa React/Supabase.

Dominios previstos: pricing, materials, labor, expenses, scenarios, licenses y account; cada uno con domain/application/infrastructure/ui cuando crezca. Módulos de ropa, repostería y artesanía quedan fuera del MVP.

Multiusuario: business_id y business_memberships con roles; un usuario puede pertenecer a varios negocios. Toda autorización se valida en PostgreSQL/RLS, nunca solo en frontend. Separar Supabase dev/staging/prod. No reutilizar infraestructura EYESITE.

Nombres técnicos en inglés, UI inicial español, textos centralizados, componentes pequeños, contratos explícitos, commits pequeños y sin any injustificado.
