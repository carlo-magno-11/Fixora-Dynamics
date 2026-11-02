# Estrategia de pruebas

## Pirámide

1. Unitarias (rápidas): motor monetario, validadores, reglas de dominio y límites.
2. Integración: repositorios contra Supabase local; persistencia, transacciones, constraints y RLS.
3. End-to-end: flujos completos de registro, negocio, cálculo, historial y licencia en navegador.
4. Seguridad: usuario A no puede leer/modificar datos del negocio B; rol viewer no modifica; invitaciones no se pueden reutilizar; activaciones concurrentes no exceden el límite.

## Casos obligatorios del motor

- valores cero, cantidades fraccionarias y decimales largos;
- horas/minutos y costes altos;
- merma y comisión en límites;
- descuento y margen objetivo;
- precio redondeado frente a precio de precisión interna;
- comisión y descuento combinados;
- tasa >= 100%, negativos, NaN e Infinity;
- coste cero y contribución no positiva;
- no doble conteo de gastos fijos en punto de equilibrio.

## Calidad

Cada PR debe pasar typecheck, unit tests y build. No aprobar funcionalidades de persistencia sin pruebas RLS de aislamiento entre dos usuarios/tenants. Tests usan datos ficticios y proyecto local o efímero sin facturación. Ninguna prueba escribe en producción.
