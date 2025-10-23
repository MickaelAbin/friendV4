# Backend API

API Express + Prisma pour la gestion des utilisateurs, sessions et resultats.

## Prerequis

- Node.js 20+
- pnpm

## Commandes

- `pnpm install` : installer les dependances (depuis la racine du workspace).
- `pnpm prisma:generate` : generer le client Prisma.
- `pnpm migrate:dev` : appliquer les migrations sur la base locale SQLite.
- `pnpm dev` : lancer le serveur en mode developpement (port 3001 par defaut).
- `pnpm build` / `pnpm start` : construire puis lancer le serveur compile.

## Environment

Copier `.env.example` vers `.env.local` et ajuster :

- `DATABASE_URL` : chemin SQLite (fichier `prisma/dev.db` par defaut).
- `JWT_SECRET` : chaine secrete de 16 caracteres minimum.
- `BOARD_GAME_API_*` : identifiants pour l'API externe (facultatif).
