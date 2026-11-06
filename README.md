# Buscando el Ser · App de escritorio

Aplicación de escritorio del Sistema Integral de Gestión de la Comunidad Terapéutica "Buscando El Ser". Reúne en un solo lugar el legajo de cada interno y el circuito de cobranza mensual: cuotas, pagos parciales, interés por mora, ingresos y egresos de la institución.

Proyecto Integrador · Universidad Nacional de Hurlingham.

La app no tiene base de datos propia: consume la API REST del [repositorio del backend](https://github.com/CristRamirez/proyecto-integrador-backend), publicada en Cloudflare Workers.

## Módulos

El menú lateral muestra solo los módulos que tiene el rol del usuario. La API también controla el permiso: esconder una opción no alcanza.

| Módulo | Qué se hace |
| --- | --- |
| Inicio | Indicadores del día: internos activos, cobranzas del mes y cuotas vencidas para reclamar |
| Internos | Padrón con búsqueda y filtros, alta con legajo automático, ficha, modificación, baja, reingreso con legajo nuevo y notas |
| Cobranzas | Generación de cuotas del período, registro de pagos totales y parciales, cuenta corriente |
| Ingresos | Ingresos que no son cuotas (donaciones, subsidios, eventos), con anulación |
| Egresos | Gastos de la institución por categoría, con edición y anulación |
| Reportes | Ocho reportes con gráficos, exportables a Excel y PDF |
| Configuración | Parámetros de cobranza, usuarios, auditoría y claves de integración |

## Requisitos

- Node.js 20.19 o superior (o 22.12 en adelante), que es lo que pide Vite 8.
- npm.
- Conexión a internet: por defecto la app usa la API publicada.

## Cómo correrla

```bash
npm install
npm run dev
```

`npm run dev` levanta el servidor de Vite en `http://localhost:5173` y, cuando está listo, abre la ventana de Electron. Los cambios en `src/` se ven al instante.

Para entrar hace falta un usuario del sistema. Los crea un administrador desde Configuración → Usuarios; el primer administrador se carga en la base, como explica el README del backend.

## Contra qué API se conecta

La URL de la API sale de la variable `VITE_API_URL`. Si no está definida, la app usa la API de producción:

```
https://proyecto-integrador-backend.ramirezcris-cpr.workers.dev/api
```

Para usar otra (por ejemplo, el backend corriendo en tu máquina), copiá `.env.example` a `.env.local` y cambiá el valor. Vite la lee al arrancar, así que hay que reiniciar `npm run dev` después de cambiarla. Los archivos `.env*` no se suben al repositorio, salvo `.env.example`.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Vite + Electron, la forma normal de trabajar |
| `npm run dev:renderer` | Solo Vite, para ver la app en el navegador. La exportación a Excel y PDF no anda, porque la guarda Electron |
| `npm run build` | Compila la interfaz en `dist/` |
| `npm run lint` | Revisa el código con oxlint |

## Estructura

```
electron/        proceso principal de Electron y el puente con la ventana (guardar Excel y PDF)
src/
  api/           una función por endpoint; cliente.js agrega el token y traduce los errores
  components/    piezas de interfaz compartidas (botones, campos, avisos, menú)
  modulos/       una carpeta por módulo del menú
  App.jsx        sesión, menú y navegación entre módulos
```

## Tecnologías

Electron, React, Vite y Tailwind CSS. La sesión usa el token JWT que devuelve la API y se guarda para no pedir usuario y contraseña cada vez que se abre la app.

## Equipo

Carrasco Marcos · Carrasco Lucas · Ramírez Cristian · Dondero Nicolás · Blanco Nicolás
