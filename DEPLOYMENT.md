# Guide de Déploiement

Ce guide explique comment déployer l'application **Friendv4** en utilisant l'architecture cible :
-   **Frontend** : Vercel
-   **Backend** : Render
-   **Base de données** : Clever Cloud (MySQL)
-   **CI/CD** : GitHub Actions

## Prérequis
-   Comptes sur [Vercel](https://vercel.com), [Render](https://render.com), et [Clever Cloud](https://www.clever-cloud.com).
-   Dépôt GitHub connecté.

---

## 1. Configuration de la Base de Données (Clever Cloud)
1.  Connectez-vous à Clever Cloud.
2.  Créez un nouvel add-on **MySQL** (le plan Dev est gratuit).
3.  Notez les détails de connexion, en particulier l'**URI de connexion** (commence par `mysql://...`).
    -   *Note : Vous devrez peut-être ajouter `?sslaccept=strict` à la fin de l'URL pour la compatibilité avec Prisma.*

## 2. Configuration du Backend (Render)
1.  Connectez-vous à Render.
2.  Cliquez sur **New +** -> **Web Service**.
3.  Connectez votre dépôt GitHub.
4.  Sélectionnez le dépôt `Friendv4`.
5.  Render devrait détecter le fichier `render.yaml` (sinon, choisissez "Build from render.yaml").
6.  **Variables d'Environnement** : Vous serez invité à les ajouter.
    -   `DATABASE_URL` : L'URI MySQL de Clever Cloud.
    -   `JWT_SECRET` : Une longue chaîne aléatoire pour la sécurité.
    -   `FRONTEND_URL` : L'URL de votre frontend Vercel (vous pourrez la mettre à jour plus tard).
7.  Cliquez sur **Create Web Service**.
8.  **Deploy Hook** : Allez dans Settings -> Deploy Hook. Copiez l'URL du hook. Vous en aurez besoin pour GitHub.

## 3. Configuration du Frontend (Vercel)
1.  Connectez-vous à Vercel.
2.  Cliquez sur **Add New...** -> **Project**.
3.  Importez votre dépôt GitHub.
4.  **Framework Preset** : Vite.
5.  **Root Directory** : `front` (Important !).
6.  **Variables d'Environnement** :
    -   `VITE_API_URL` : L'URL de votre backend Render (ex: `https://friendv4-server.onrender.com`).
7.  Cliquez sur **Deploy**.
8.  **Vercel Token** : Allez dans Account Settings -> Tokens -> Create. Copiez ce token.

## 4. Configuration CI/CD GitHub Actions
1.  Allez dans votre dépôt GitHub -> Settings -> Secrets and variables -> Actions.
2.  Ajoutez les "Repository secrets" suivants :
    -   `VERCEL_TOKEN` : Le token que vous avez créé dans Vercel.
    -   `RENDER_DEPLOY_HOOK_URL` : L'URL du hook de déploiement de Render.
    -   `VERCEL_ORG_ID` (Optionnel) : Si demandé par la CLI Vercel (souvent nécessaire pour les comptes d'équipe ou si le projet est lié à une équipe).
    -   `VERCEL_PROJECT_ID` (Optionnel) : L'ID du projet Vercel (trouvable dans les paramètres du projet Vercel).

## 5. Finalisation
1.  Poussez votre code sur la branche `main`.
2.  L'onglet **Actions** dans GitHub devrait montrer le workflow `CI/CD` en cours d'exécution :
    -   `deploy-backend` : Déclenche le déploiement Render.
    -   `deploy-frontend` : Déploie sur Vercel.
3.  Une fois déployé, mettez à jour la variable `FRONTEND_URL` dans Render avec votre URL Vercel réelle.

## Dépannage
-   **Erreur Prisma** : Si le backend ne parvient pas à se connecter à la BDD, vérifiez si vous devez exécuter les migrations. Vous pouvez ajouter une "Build Command" dans Render : `cd server && pnpm install && pnpm build && npx prisma migrate deploy`.
-   **Erreur CORS** : Assurez-vous que `FRONTEND_URL` dans Render correspond exactement à votre domaine Vercel (sans slash à la fin).
