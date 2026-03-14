
# ⚡ SnaapIt - Monorepo (Turborepo)

**SnaapIt** est une solution disponible sous forme d'application web et d'extension de navigateur, conçue pour optimiser la gestion des favoris. Grâce à une analyse sémantique par intelligence artificielle, l'outil indexe et catégorise automatiquement les pages enregistrées selon leur contenu.

Ce dépôt utilise [Turborepo](https://turborepo.dev/) pour gérer l'architecture monorepo du projet, séparant proprement l'application web, l'extension et les services backend.

---

## 🏗️ Architecture du Monorepo (Ce qu'il y a à l'intérieur)

Ce Turborepo comprend les applications et packages suivants, basés sur notre architecture fonctionnelle :

### Applications (Apps)
- `apps/web` : L'application Web principale (Dashboard, Moteur de recherche vectoriel), développée avec **SvelteKit** et **TypeScript**.
- `apps/extension` : L'extension de navigateur (Compatible Manifest V3), développée avec **Svelte**.
- `apps/api` : Le Core Engine / Backend (Node.js/TypeScript) gérant le scraping, l'API d'IA (Vectorisation) et les communications avec les bases de données.

### Packages Partagés (Packages)
- `@repo/ui` : Une librairie de composants UI Svelte partagée entre `web` et `extension`.
- `@repo/eslint-config` : Configurations `eslint` partagées pour maintenir un code propre.
- `@repo/typescript-config` : Fichiers `tsconfig.json` utilisés à travers tout le monorepo.

## 🛠️ Stack Technique

- **Frontend** : TypeScript, Svelte, SvelteKit.
- **Backend** : Node.js, TypeScript.
- **Bases de données** : PostgreSQL (données relationnelles) et VectorDB (LanceDB/Chroma pour la recherche sémantique).
- **Design/UI** : Pack d'icônes Lucide Svelte.

---

## 🚀 Démarrage Rapide

Ce Turborepo intègre déjà les outils suivants pré-configurés :
- [TypeScript](https://www.typescriptlang.org/) pour le typage statique
- [ESLint](https://eslint.org/) pour le linting
- [Prettier](https://prettier.io) pour le formatage du code

### Développer (Environnement de dev)

Pour lancer toutes les applications et packages en mode développement, exécutez :

Avec [`turbo` installé globalement](https://turborepo.dev/docs/getting-started/installation#global-installation) (recommandé) :
```sh
turbo dev

```

Sans `turbo` global, utilisez votre gestionnaire de paquets (ex: pnpm, yarn, npm) :

```sh
npx turbo dev
# ou
pnpm exec turbo dev

```

Vous pouvez cibler une application spécifique en utilisant un [filtre](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters) :

```sh
turbo dev --filter=web

```

### Compiler (Build pour la production)

Pour compiler toutes les applications et préparer les livrables (App Web & Extension) :

```sh
turbo build

```

Pour compiler spécifiquement l'extension (par exemple, avant de la charger dans Chrome) :

```sh
turbo build --filter=extension

```

---

## ☁️ Mise en cache distante (Remote Caching)

Turborepo utilise une technique appelée [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) pour partager les artefacts de build entre les machines, ce qui accélère considérablement les temps de compilation pour l'équipe.

Pour lier votre dépôt local au Remote Cache (via Vercel) :

```sh
turbo login
turbo link

```

## 🔗 Liens Utiles du Projet

* **Dépôt GitHub** : [https://github.com/CustomEntity/Snaapit](https://www.google.com/search?q=https://github.com/CustomEntity/Snaapit)
* [Documentation Turborepo](https://turborepo.dev/docs)

```

```
