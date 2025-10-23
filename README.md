# Board Game Session Manager

Workspace monorepo inspiree de `quick-app-distribution` pour organiser des apres-midis jeux de societe.

## Packages

- `front/` - application React + Vite pour la gestion des utilisateurs, sessions et resultats.
- `server/` - API Node.js/Express en TypeScript avec Prisma (SQLite par defaut) et integration avec une API jeux de societe.

## Commandes globales

| Commande       | Description                                             |
| -------------- | ------------------------------------------------------- |
| `pnpm install` | Installe les dependances pour tous les packages.        |
| `pnpm dev`     | Lance front et back en parallele (ports 5173 & 3001).   |
| `pnpm build`   | Compile front et back.                                  |
| `pnpm lint`    | Lint global (workspace + packages).                     |

Voir les README dedies dans `front/` et `server/` pour plus de details.
