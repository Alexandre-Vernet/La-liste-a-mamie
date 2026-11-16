# CLAUDE.md

Ce fichier donne le contexte et les règles à suivre pour travailler sur ce projet.

## Le projet

« La liste à mamie » est une application Angular de liste de courses : on ajoute des articles (avec une quantité),
on les coche quand ils sont achetés, on peut les renommer, en changer la quantité,
filtrer la liste et vider les articles achetés. Les données sont persistées dans le
`localStorage` du navigateur.

- `src/app/groceries/grocery.model.ts` — modèle `Grocery` et type `Filter`.
- `src/app/groceries/grocery.service.ts` — état de la liste (signaux + `computed`),
  toute la logique métier (ajout, suppression, anti-doublon, quantités, filtres).
- `src/app/groceries/grocery-dictionary.ts` — catalogue de produits courants
  (`GROCERY_CATEGORIES`), dictionnaire à plat dérivé (`GROCERY_DICTIONARY`) et
  fonction pure de suggestion (auto-complétion de l'ajout). `suggestGroceryNames`
  classe les résultats (`matchRank`, exporté) pour faire remonter une
  correspondance exacte ou en début de nom avant une simple correspondance en
  milieu de nom — ex. chercher « eau » doit faire remonter « eau » avant
  « poireau » ou « gâteau ». `GroceryCatalogPage` réutilise `matchRank` pour trier
  ses résultats de la même façon (voir plus bas) — ne pas réimplémenter un
  classement différent côté catalogue. `categoryOf(name)` et
  `groupGroceriesByCategory(groceries)` dérivent le rayon d'un produit à partir
  de `GROCERY_CATEGORIES` ; un produit hors catalogue tombe dans le rayon
  « Autres », toujours en dernier.
- `src/app/groceries/grocery-icons.ts` — fonction pure `groceryIcon(name)` qui associe
  un emoji à un nom de produit. Voir la règle [Icône de chaque produit](#icône-de-chaque-produit)
  plus bas.
- `src/app/groceries/grocery-item/` — composant d'affichage d'un article de la liste.
- `src/app/groceries/grocery-list-page/` — page « Ma liste » (formulaire d'ajout,
  suggestions, filtres, résumé, confettis). Route `/`. Les suggestions s'affichent
  dans un panneau flottant (`.suggestions`, positionné en `absolute` sous le champ
  via un conteneur `.search` en `position: relative`) avec icône + nom par ligne —
  pas de pastilles (« badges ») côte à côte : ne pas réintroduire ce pattern. Les
  articles « à acheter » (`activeGroups`) sont groupés par rayon dans l'ordre du
  catalogue — via `groupGroceriesByCategory` — pour suivre un parcours en
  magasin plutôt que l'ordre d'ajout ; les articles achetés (`completedGroceries`)
  restent une liste à part, sous un en-tête « Acheté », non groupée (l'ordre n'a
  plus d'importance une fois l'article dans le panier).
- `src/app/groceries/grocery-catalog-page/` — page « Produits » : tous les produits
  du catalogue groupés par catégorie, à ajouter à la liste en un clic. Route `/produits`.
  Les rayons et les produits qu'ils contiennent sont triés par pertinence
  (`matchRank`, partagé avec `suggestGroceryNames`) dès qu'une recherche est en
  cours : le rayon contenant la meilleure correspondance remonte en premier.
- `src/app/bottom-nav/` — menu de navigation fixé en bas d'écran (style mobile),
  pour passer d'une page à l'autre.
- `src/app/theme/theme.service.ts` — thème `light`/`dark` uniquement (pas d'option
  « automatique »), persisté dans `localStorage`, applique l'attribut `data-theme`
  sur `<html>`. Sans thème enregistré (premier lancement), il part du thème système
  une seule fois, sans le suivre ensuite.
- `src/app/theme-toggle/` — bouton flottant (icône soleil/lune) qui bascule entre
  clair et sombre. Affiché dans la coquille `App`, pas par page.
- `src/app/pwa-update/pwa-update.service.ts` — détecte les nouvelles versions du
  service worker et déclenche le rechargement en cas d'état irrécupérable.
- `src/app/pwa-update-toast/` — bandeau « Nouvelle version disponible » affiché
  dans la coquille `App` quand `PwaUpdateService` détecte une mise à jour.
- `src/app/app-badge/app-badge.service.ts` — synchronise le badge de l'icône de
  l'app installée (Badging API) avec `GroceryService.remaining()`. Instancié au
  démarrage via `provideAppInitializer` dans `app.config.ts`, pas par `App`
  (voir la section [PWA](#pwa) plus bas).
- `src/app/app.ts` / `app.html` / `app.scss` — coquille de l'app : `<router-outlet>`
  + menu du bas. Ne contient aucune logique métier.
- `src/app/app.routes.ts` — déclaration des routes (une page = un composant).
- `src/styles.scss` — variables de thème **et** classes partagées entre pages
  (`.page`, `.card`, `h1`, `.date`, `.summary`, `.hint`) : évite de dupliquer ces
  styles dans chaque page.
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

## Tests

Chaque fonctionnalité ajoutée ou modifiée doit être complétée par des tests qui la
couvrent (`*.spec.ts`, Vitest) — pas seulement vérifier que les tests existants
passent toujours.

- Une fonction pure (dans `grocery-dictionary.ts`, `grocery-icons.ts`…) a son
  propre fichier de test (ex. `grocery-icons.spec.ts`) qui couvre le cas nominal,
  les cas limites et les cas de repli.
- Un comportement utilisateur (ajouter un article, filtrer, rechercher…) a un test
  au niveau du composant concerné qui simule l'interaction réelle (saisie, clic) et
  vérifie le résultat observable, à l'image des tests déjà présents dans
  `grocery-list-page.spec.ts` et `grocery-catalog-page.spec.ts`.
- Un bug corrigé doit avoir un test qui aurait échoué avant le correctif, pour
  éviter une régression silencieuse.

## Documentation (README)

Le [`README.md`](./README.md) présente le projet aux visiteurs du dépôt (texte +
captures d'écran). Pour chaque fonctionnalité ajoutée ou modifiée visible par
l'utilisateur :

- Mettre à jour le texte du README (section « Fonctionnalités » ou autre section
  pertinente) pour décrire la nouvelle fonctionnalité.
- Ajouter ou mettre à jour une capture d'écran qui la démontre dans
  `docs/screenshots/` (captures Playwright pilotées en local, voir la section
  [Responsive](#responsive) pour la méthode).
- Ne pas laisser une fonctionnalité livrée sans sa démonstration dans le README :
  le README doit rester le reflet fidèle de l'état actuel de l'app, pas de son état
  au moment de sa création.

## Stack

- Angular 22, composants **standalone** (pas de `NgModule`).
- Détection de changements **sans Zone.js**, pilotée par les signaux.
- Styles en SCSS, un fichier de style par composant.
- Tests avec Vitest (`*.spec.ts`), exécutés via `ng test`.
- Formatage via Prettier (voir `.prettierrc`) — ne pas reformater à la main.
- **PWA** : service worker (`@angular/service-worker`) + manifeste installable.
  Voir la section [PWA](#pwa) plus bas.
- Navigation en transitions douces : `provideRouter(routes, withViewTransitions())`
  dans `app.config.ts` (View Transitions API du navigateur, aucun code de
  transition à maintenir à la main).

## UX et animations

- Toute animation/transition doit respecter `prefers-reduced-motion` : le filet de
  sécurité global est dans `src/styles.scss` (coupe les animations/transitions pour
  les utilisateurs qui ont désactivé les animations) — pas besoin de le refaire
  composant par composant, mais ne pas contourner ce filet avec `!important` ailleurs.
- Les boutons/éléments interactifs ont un retour tactile cohérent au clic
  (`:active { transform: scale(...) }`), avec un easing `cubic-bezier(0.22, 1, 0.36, 1)`
  plutôt que `ease` pour les transitions qui doivent sembler « fluides » (suggestions,
  puces de produits, onglets du menu).
- Suppression destructive (supprimer un article) : toujours accompagnée d'un moyen
  d'annuler (snackbar « Annuler » quelques secondes), jamais une suppression silencieuse
  et définitive. Voir `removeGrocery`/`undoRemove` dans `grocery-list-page.ts` et
  `GroceryService.restore()` comme patron à suivre pour toute nouvelle suppression.
- **Mise en page tactile de `grocery-item`** (uniquement sur tactile, via
  `@media (hover: none)` — la version desktop ne change pas) : la case à cocher,
  l'icône et le nom doivent tenir sur une seule ligne, y compris pour un nom long
  (ex. « après-shampoing »). Deux éléments normalement toujours visibles sont donc
  remplacés sur tactile pour libérer la largeur du nom :
  - Le stepper `− 2 +` devient un badge compact `×2` (`.qty-badge`) qui se déplie
    au tap (`toggleQuantity()`/`quantityExpanded`) ; retaper sur la valeur, ou
    cliquer n'importe où ailleurs sur la page (`onDocumentClick`, écoute
    `document:click`), le replie. Un clic à l'intérieur de l'article (ex. sur les
    boutons `+`/`−` eux-mêmes) ne le replie pas. Sur desktop, le stepper reste
    toujours visible, inchangé.
  - Le bouton « Supprimer » toujours visible est remplacé par un swipe vers la
    gauche sur la ligne (`onSwipeStart`/`onSwipeMove`/`onSwipeEnd`, `.row`
    translaté via `rowTransform`) : au-delà de `SWIPE_DELETE_THRESHOLD_PX`,
    l'article est supprimé (réutilise `requestRemove()`, donc toujours annulable
    via le snackbar ci-dessus) ; sinon la ligne revient à sa position. Le bouton
    `.swipe-delete` révélé par le swipe reste présent dans le DOM (juste masqué
    derrière `.row`) pour rester accessible au clavier/lecteur d'écran même sans
    geste tactile — sur desktop il est entièrement `display: none`.
  - Un geste majoritairement vertical (`|deltaY| >= |deltaX|`) est ignoré pour ne
    pas bloquer le défilement de la liste.
- Renommer un article se fait par **un simple clic** sur son nom (`startEditing()`),
  desktop et tactile confondus — pas de double-clic : sur tactile, le double-tap
  entre en concurrence avec le zoom natif du navigateur et n'est pas fiable. La
  saisie se valide avec Entrée (`keydown.enter`) ou en cliquant n'importe où
  ailleurs sur la page (`(blur)` sur le champ d'édition).
- Thème sombre : piloté entièrement par l'attribut `data-theme` sur `<html>`
  (`ThemeService`), pas par `@media (prefers-color-scheme)` dans le SCSS — ce media
  query ne doit **pas** être réintroduit dans `styles.scss`, il empêcherait de forcer
  un thème indépendamment du système. Le petit script inline de `index.html` applique
  le thème avant le premier rendu (évite un flash) ; sa clé `localStorage` doit rester
  synchronisée avec `ThemeService`.

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
- `public/icons/` : icônes de l'app générées à partir du logo (`docs/logo.png`), pas
  le logo Angular par défaut — organisées par plateforme (`android/`, `ios/`,
  `windows/`), chaque fichier référencé par son chemin exact dans
  `manifest.webmanifest` (`icons`). En cas de régénération de ces icônes, vérifier
  que chaque entrée de `manifest.webmanifest` pointe vers un fichier qui existe
  réellement sous ce chemin, avec la taille déclarée (`sizes`) qui correspond aux
  dimensions réelles du fichier.
- `src/index.html` : lien vers le manifeste + `<meta name="theme-color">` (light et
  dark, alignés sur les variables de `styles.scss`).
- `ngsw-config.json` : décrit ce que le service worker met en cache. Si un nouveau
  type de fichier statique est ajouté dans `public/`, vérifier qu'il est bien couvert
  par un `assetGroups` existant ou en ajouter un.
- `src/app/app.config.ts` : `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), ... })`
  — le service worker est **désactivé en dev**. `ng serve` ne l'active jamais : pour
  le tester, faire `npm run build` puis servir le dossier `dist/la-liste-a-mamie/browser`
  (ex. `npx http-server dist/la-liste-a-mamie/browser`).
- Après tout changement touchant la PWA, vérifier que `ng build` produit bien
  `manifest.webmanifest` et `ngsw-worker.js` dans `dist/la-liste-a-mamie/browser`.
- **Mise à jour forcée** (`PwaUpdateService`) : le service worker ne vérifie jamais
  de lui-même qu'une nouvelle version existe tant que l'app reste ouverte — sans
  ça, un onglet déjà ouvert reste bloqué sur l'ancienne version indéfiniment (seul
  un vidage manuel du cache la débloquait). `PwaUpdateService` appelle
  `checkForUpdate()` une fois l'app stable puis toutes les 6h, et affiche
  `PwaUpdateToast` (bandeau « Nouvelle version disponible ») dès qu'un
  `VERSION_READY` est reçu ; le bouton du bandeau fait `document.location.reload()`
  (jamais `activateUpdate()` sans reload, qui peut casser l'app par désynchronisation
  shell/chunks — voir la doc d'`@angular/service-worker`). Un état `unrecoverable`
  déclenche un rechargement immédiat, sans attendre d'interaction.
  Pour tester ce flux : `npm run build`, servir `dist/la-liste-a-mamie/browser`,
  charger l'app, attendre l'enregistrement du service worker (`registerWhenStable:30000`),
  puis reconstruire et redéployer par-dessus **sans** fermer l'onglet — le bandeau
  doit apparaître après la vérification suivante.
- **Badge de l'icône** (`AppBadgeService`) : synchronise le badge natif de l'icône
  de l'app installée avec `GroceryService.remaining()` via l'API `navigator.setAppBadge`/
  `clearAppBadge` (effet déclenché sur `remaining()`, retire le badge — pas
  `setAppBadge(0)` — dès que tout est acheté). Ces méthodes sont typées par défaut
  par TypeScript (`lib.dom.d.ts`) mais ne sont pas implémentées par tous les
  navigateurs : toujours vérifier `typeof navigator.setAppBadge === 'function'`
  avant d'appeler l'API (ne jette pas en environnement de test, contrairement à
  `window.matchMedia`, mais le garde reste nécessaire pour les navigateurs qui ne
  supportent pas l'API). Le service est instancié au démarrage via
  `provideAppInitializer` dans `app.config.ts` (pas de composant dédié, rien à
  afficher) ; `App` n'en a donc pas besoin dans son template.

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

### Icône de chaque produit

- Chaque article affiché (dans la liste comme dans le catalogue) doit toujours
  montrer une icône — jamais d'absence d'icône. La résolution se fait via
  `groceryIcon(name)` (`grocery-icons.ts`) en trois niveaux : icône spécifique au
  produit si elle existe, sinon icône du rayon auquel appartient le produit (pour
  tout produit du catalogue), sinon l'emoji caddie 🛒 par défaut (uniquement pour un
  article tapé librement par l'utilisateur et absent du catalogue).
- Quand un produit est ajouté à `grocery-dictionary.ts`, lui ajouter une icône
  spécifique dans `grocery-icons.ts` (`PRODUCT_ICONS`) chaque fois qu'un emoji
  pertinent existe. Ce n'est que si aucun emoji ne représente correctement le
  produit qu'on le laisse retomber sur l'icône du rayon.
- Un nouveau rayon dans `GROCERY_CATEGORIES` doit avoir une entrée correspondante
  dans `CATEGORY_FALLBACK_ICONS`, sans quoi ses produits sans icône spécifique
  retomberaient à tort sur le caddie 🛒.

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

### Pages et navigation

- Chaque route pointe vers un composant « page » dédié (`*-page.ts`), jamais vers
  le composant racine `App`. `App` reste une coquille : `<router-outlet>` + menu du
  bas, aucune logique métier, aucun `inject()` de service.
- Une nouvelle page = déclarer sa route dans `app.routes.ts`, l'ajouter au menu du
  bas (`bottom-nav.ts`) si elle doit être accessible directement, et réutiliser les
  classes partagées de `styles.scss` (`.page`, `.card`, `h1`, `.summary`, `.hint`)
  plutôt que de les redéfinir dans le SCSS de la page.
- Le style spécifique à une page (sections, listes, formulaires propres à cette
  page) reste dans le fichier `.scss` de cette page, pas dans le fichier global.

### Nommage

- Fichiers : `nom.model.ts`, `nom.service.ts`, `nom.ts`/`nom.html`/`nom.scss` pour les
  composants (un dossier par composant).
- Services suffixés `Service` (`GroceryService`), jamais `Store`/`Manager`/`Helper`.
- Modèles de données au singulier (`Grocery`, pas `Groceries`).
