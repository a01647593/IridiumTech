# Whirlpool Adaptive Platform

Base full-stack para el reto: frontend React + backend Express + WebSockets + persistencia local en JSON.

## Incluye
- Chatbot UI con mensajes persistidos.
- Notificaciones proactivas tipo Whirlpool.
- Carga de archivos.
- Logs visuales y panel de depuración.
- Endpoint de adaptabilidad por usuario.
- Socket.io para eventos en tiempo real.

## Estructura
- `src/` frontend.
- `server/` backend.
- `shared/` tipos compartidos.
- `data/state.json` persistencia local generada al ejecutar el backend.

## Arranque
1. Instala dependencias.
2. Ejecuta `npm run dev`.
3. Abre `http://localhost:5173`.

## Endpoints principales
- `GET /api/health`
- `GET /api/adaptability/:userId`
- `GET /api/messages/:userId`
- `POST /api/messages`
- `POST /api/upload`
- `POST /api/whirlpool/event`

## Variables de entorno
- `VITE_API_BASE_URL` opcional, por defecto usa el mismo origen con proxy de Vite.
- `PORT` opcional para el backend, por defecto `3001`.

## Repo
IridiumTech / Whirlpool
