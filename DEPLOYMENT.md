# Deploiement gratuit simplifie

## API (Railway)

1. Creer un compte gratuit sur https://railway.app.
2. Importer ce depot depuis GitHub ou utiliser Railway CLI pour deployer le dossier `server`.
3. Configurer les variables d'environnement (voir `server/.env.example`).
4. Ajouter une base SQLite persistee via le volume de stockage ou utiliser PostgreSQL gerer par Railway.
5. Deployer : Railway installera les dependances et lancera `pnpm start`.

## Front (Vercel)

1. Creer un compte gratuit sur https://vercel.com.
2. Importer le projet et selectionner le dossier `front`.
3. Definir `VITE_API_URL` vers l'URL exposee par le serveur Railway.
4. Conserver la commande build `pnpm build` et output `dist`.
5. Lancer le deployement et connecter le domaine genere par Vercel.

## Monorepo

- Utiliser `pnpm install --filter front...` et `--filter server...` si la plateforme ne gere pas le workspace complet.
- Synchroniser les variables d'environnement entre les deux services (origine CORS, URL API, clef JWT).
