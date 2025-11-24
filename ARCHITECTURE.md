# Architecture du Projet Friendv4

Ce document décrit l'architecture technique de l'application **Friendv4**, une plateforme de gestion de sessions de jeux de société.

## 1. Vue d'ensemble

Le projet est structuré comme un monorepo contenant deux parties principales :
-   **`front/`** : L'application client (Single Page Application).
-   **`server/`** : L'API RESTful et la logique métier.

L'ensemble est orchestré par **GitLab CI/CD** pour le déploiement continu vers **Vercel** (Front) et **Render** (Back), avec une base de données **MySQL** hébergée sur **Clever Cloud**.

---

## 2. Architecture Frontend (`front/`)

### Technologies Clés
-   **Framework** : React 18 avec TypeScript.
-   **Build Tool** : Vite (pour un développement rapide et des builds optimisés).
-   **Styles** : Sass (Modules & Global) avec une méthodologie BEM/SMACSS simplifiée.
-   **State Management** : TanStack Query (React Query) pour la gestion de l'état serveur (cache, revalidation).
-   **Routing** : React Router v6.
-   **Validation** : Zod + React Hook Form pour les formulaires.
-   **Animations** : Framer Motion & Canvas Confetti.

### Structure des Dossiers
-   `src/api/` : Couche de communication avec le backend (Axios).
-   `src/assets/` : Images et ressources statiques.
-   `src/authentication/` : Contexte et logique d'authentification (JWT).
-   `src/components/` : Composants UI réutilisables (Boutons, Cartes, Loaders...).
-   `src/pages/` : Composants de haut niveau correspondant aux routes (Dashboard, Ludothèque...).
-   `src/styles/` : Variables globales, mixins et thèmes Sass.
-   `src/routes/` : Définition des routes et protection (Auth Guards).

### Design System "Café Ludique"
L'interface suit une charte graphique "Vintage Board Game" :
-   Couleurs : Beige crème, Bleu marine, Terracotta.
-   Typographie : Merriweather (Titres) & Montserrat (Corps).
-   Composants : Effets de volume, ombres portées, avatars Meeple.

---

## 3. Architecture Backend (`server/`)

### Technologies Clés
-   **Runtime** : Node.js (v20+).
-   **Framework** : Express.js.
-   **Langage** : TypeScript.
-   **ORM** : Prisma (pour l'interaction avec MySQL).
-   **Base de Données** : MySQL (Relationnelle).
-   **Authentification** : JWT (JSON Web Tokens) avec bcrypt pour le hachage des mots de passe.

### Structure des Dossiers
-   `src/controllers/` : Logique de traitement des requêtes HTTP.
-   `src/middlewares/` : Gestion des erreurs, authentification, logs.
-   `src/routes/` : Définition des endpoints API.
-   `src/services/` : Logique métier complexe (ex: scraping BGG).
-   `prisma/` : Schéma de la base de données (`schema.prisma`) et migrations.

### Modèle de Données (Prisma)
Les entités principales sont :
-   `User` : Utilisateurs et organisateurs.
-   `Session` : Événements de jeu planifiés.
-   `Game` : Jeux de société (référencés ou importés).
-   `Participation` : Lien entre User et Session (avec statut d'invitation).
-   `Result` : Scores et classements des parties jouées.

---

## 4. CI/CD & Déploiement

Le déploiement est entièrement automatisé via **GitLab CI/CD**.

### Pipeline `.gitlab-ci.yml`
Le pipeline se compose de 5 étapes :
1.  **Install** : Installation des dépendances (pnpm).
2.  **Lint** : Vérification de la qualité du code (ESLint).
3.  **Test** : Exécution des tests unitaires (Vitest).
4.  **Build** : Compilation du projet (TypeScript/Vite).
5.  **Deploy** (Branche `main` uniquement) :
    -   **Backend** : Appel d'un Webhook Render (`curl`) pour déclencher le déploiement.
    -   **Frontend** : Utilisation de la CLI Vercel pour déployer les artefacts statiques.

### Infrastructure Cible
-   **Frontend (Vercel)** :
    -   Hébergement statique mondial (CDN).
    -   Gestion du routing SPA via `vercel.json` (Rewrites).
-   **Backend (Render)** :
    -   Service Web Node.js.
    -   Configuration via `render.yaml` (Infrastructure as Code).
    -   Variables d'environnement injectées (DATABASE_URL, JWT_SECRET...).
-   **Base de Données (Clever Cloud)** :
    -   MySQL managé.
    -   Accessible via URI sécurisée.

### Flux de Données
1.  Le client (React) envoie une requête API.
2.  Vercel proxy/rewrite la requête vers Render (si configuré) ou le client appelle directement l'URL Render.
3.  Express (Render) traite la requête, valide le JWT.
4.  Prisma interroge MySQL (Clever Cloud).
5.  La réponse remonte la chaîne jusqu'au client.
