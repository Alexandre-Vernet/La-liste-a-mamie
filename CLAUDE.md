# CLAUDE.md

Ce fichier donne le contexte et les règles à suivre pour travailler sur ce projet.

## Le projet

Application Angular de liste de courses : on ajoute des articles (avec une quantité),
on les coche quand ils sont achetés, on peut les renommer, en changer la quantité,
filtrer la liste et vider les articles achetés. Les données sont persistées dans le
`localStorage` du navigateur.

- `src/app/groceries/grocery.model.ts` — modèle `Grocery` et type `Filter`.
- `src/app/groceries/grocery.service.ts` — état de la liste (signaux + `computed`),
  toute la logique métier (ajout, suppression, anti-doublon, quantités, filtres).
- `src/app/groceries/grocery-dictionary.ts` — dictionnaire de produits courants et
  fonction pure de suggestion (auto-complétion de l'ajout).
- `src/app/groceries/grocery-item/` — composant d'affichage d'un article.
- `src/app/app.ts` / `app.html` / `app.scss` — composant racine (formulaire d'ajout,
  suggestions, filtres, résumé, confettis).
- `public/manifest.webmanifest`, `public/icons/` — manifeste et icônes de la PWA.
- `ngsw-config.json` — configuration du service worker (fichiers mis en cache).

## Commandes

```bash
npm start          # ng serve — lance l'app en local
npm test           # ng test — lance les tests (Vitest)
npm run build      # ng build — build de production
npx prettier --write "src/**/*.{ts,html,scss}"   # formatage
```

Toujours lancer `npm test` (et idéalement `npm run build`) après une modification.

## Stack

- Angular 22, composants **standalone** (pas de `NgModule`).
- Détection de changements **sans Zone.js**, pilotée par les signaux.
- Styles en SCSS, un fichier de style par composant.
- Tests avec Vitest (`*.spec.ts`), exécutés via `ng test`.
- Formatage via Prettier (voir `.prettierrc`) — ne pas reformater à la main.
- **PWA** : service worker (`@angular/service-worker`) + manifeste installable.
  Voir la section [PWA](#pwa) plus bas.

## Responsive

L'application doit rester utilisable et lisible sur toutes les tailles d'écran,
d'un petit téléphone (~320px) à un grand écran de bureau, avec la même base de code
(pas de version mobile séparée).

- Pas de largeur figée en pixels pour la mise en page : utiliser `%`, `rem`, `clamp()`
  ou `max-width` (voir `:host`/`.card` dans `app.scss` pour l'exemple à suivre).
- Un titre, un label ou le nom d'un article peut toujours passer à la ligne (texte
  long, zoom, petit écran) : la mise en page doit rester correcte dans ce cas, pas
  seulement dans le cas "idéal" sur une seule ligne. Exemple : le `h1` de `app.html`
  utilise `align-items: flex-start` plutôt que `center`, pour que l'icône reste bien
  alignée que le titre tienne sur une ou deux lignes.
- Cibler le tactile avec `@media (hover: none)`, pas une largeur d'écran arbitraire :
  une tablette peut être tactile, un petit écran de bureau ne l'est pas. C'est ce
  média qui augmente la taille des boutons `+`/`-`/suppression dans `grocery-item.scss`.
- Zones tactiles d'au moins ~30px de côté pour tout élément cliquable sur support
  tactile (checkbox, steppers de quantité, bouton de suppression).
- Avant de considérer une modification de mise en page comme terminée, vérifier le
  rendu à plusieurs largeurs courantes (320px, 360px, 768px, desktop) — par exemple
  via des captures d'écran Playwright pilotées en local.

## PWA

L'application est installable et fonctionne hors-ligne grâce à
`@angular/service-worker`, ajouté via `ng add @angular/pwa`.

- `public/manifest.webmanifest` : nom, description, couleurs (`theme_color`,
  `background_color`) et icônes de l'app — toujours cohérents avec l'identité de
  l'app (pas les valeurs par défaut du schematic Angular).
- `public/icons/` : icônes aux tailles `72` à `512px`, générées à partir du pictogramme
  du panier utilisé dans l'en-tête, pas le logo Angular par défaut.
- `src/index.html` : lien vers le manifeste + `<meta name="theme-color">` (light et
  dark, alignés sur les variables de `styles.scss`).
- `ngsw-config.json` : décrit ce que le service worker met en cache. Si un nouveau
  type de fichier statique est ajouté dans `public/`, vérifier qu'il est bien couvert
  par un `assetGroups` existant ou en ajouter un.
- `src/app/app.config.ts` : `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), ... })`
  — le service worker est **désactivé en dev**. `ng serve` ne l'active jamais : pour
  le tester, faire `npm run build` puis servir le dossier `dist/test-claude/browser`
  (ex. `npx http-server dist/test-claude/browser`).
- Après tout changement touchant la PWA, vérifier que `ng build` produit bien
  `manifest.webmanifest` et `ngsw-worker.js` dans `dist/test-claude/browser`.

## Règles de base TypeScript

- Pas de `any`. Si un type est difficilement exprimable, créer une interface/type
  dédié plutôt que d'élargir le typage.
- Toujours typer les paramètres et les valeurs de retour des fonctions publiques.
- Préférer `interface` pour les formes de données, `type` pour les unions/alias.
- Utiliser `const` par défaut ; `let` seulement si la variable est réellement réassignée.
- Pas de valeurs magiques répétées : extraire une constante nommée (ex. `CONFETTI_DURATION_MS`).
- Une fonction = une responsabilité. Si une méthode fait plusieurs choses distinctes,
  la découper en méthodes privées nommées explicitement.

## Règles de base Angular

- Composants **standalone**, jamais de `NgModule`.
- Utiliser la nouvelle syntaxe de template (`@if`, `@for`, `@switch`), jamais `*ngIf`/`*ngFor`.
- Injection via `inject()`, pas via le constructeur.
- Un service par domaine métier, suffixé `Service` (ex. `GroceryService`), annoté
  `@Injectable({ providedIn: 'root' })`.
- Les composants communiquent avec leurs parents via `input()` / `output()` (signal-based),
  pas via `@Input()` / `@Output()` ni `EventEmitter` direct.
- Un composant ne doit pas connaître les détails d'implémentation d'un autre : il passe
  par les `input`/`output` exposés, jamais par un accès direct à l'état interne.

## Règles spécifiques à ce projet

### État : signaux et `computed`

- Tout l'état réactif passe par `signal()` et `computed()` — pas de champs mutables
  observés "à la main", pas de RxJS pour de l'état simple.
- Une valeur dérivée (compteur, filtre appliqué, pourcentage, message…) est **toujours**
  un `computed`, jamais recalculée à la volée dans le template ou dupliquée dans plusieurs
  méthodes.
- `effect()` est réservé aux effets de bord réels (persistance `localStorage`, déclenchement
  d'une animation…), jamais pour dériver une valeur affichée.

### Visibilité des membres

- `private` par défaut pour tout ce qui n'est utilisé que dans la classe.
- `protected` uniquement pour ce qui est lu depuis le template du composant.
- `public` (donc sans modificateur) réservé à l'API réellement consommée depuis
  l'extérieur de la classe (ex. méthodes d'un service appelées par un composant).
- `readonly` sur toute propriété qui n'est jamais réassignée après son initialisation
  (signaux compris : `protected readonly duplicate = signal(false)`).

### Peu de logique dans le HTML

- Le template ne fait que de l'affichage et de la liaison d'événements. Toute logique
  (condition métier, mise en forme de texte, pluriel, calcul, concaténation de chaînes…)
  est calculée côté composant (`computed`, méthode) et exposée déjà prête à afficher.
- Un `@if`/`@for`/`@switch` structurel reste dans le template (c'est de l'affichage),
  mais la condition elle-même doit rester simple (lecture d'un signal, pas de calcul
  inline).
- Exemple à suivre : `summary = computed(() => ...)` dans `app.ts`, affiché en
  `{{ summary() }}` dans `app.html` — pas de `@if`/`@else` imbriqués ni de ternaire
  dans le template pour construire ce message.

### Accolades sur les `if`

- Toujours des accolades, même pour une seule instruction :

  ```ts
  // À éviter
  if (!trimmed) return false;

  // À faire
  if (!trimmed) {
    return false;
  }
  ```

### Code lisible et aéré

- Une ligne vide entre les blocs logiques distincts d'une méthode (garde/retour anticipé,
  calcul, effet de bord, retour final).
- Pas de one-liner qui enchaîne plusieurs opérations (ex. ne pas écrire
  `if (added) input.value = '';` sur une ligne — cf. règle sur les accolades).
- Des noms explicites plutôt que des commentaires : un commentaire n'est utile que pour
  expliquer un *pourquoi* non évident (contrainte cachée, contournement), jamais pour
  répéter ce que le code dit déjà.

### Nommage

- Fichiers : `nom.model.ts`, `nom.service.ts`, `nom.ts`/`nom.html`/`nom.scss` pour les
  composants (un dossier par composant).
- Services suffixés `Service` (`GroceryService`), jamais `Store`/`Manager`/`Helper`.
- Modèles de données au singulier (`Grocery`, pas `Groceries`).
