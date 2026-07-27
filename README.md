# Dental Clinic OS

Démonstration commerciale d'un logiciel de gestion de cabinet dentaire pensé
pour le Maroc. Français et arabe, RTL complet. Trois rôles : dentiste,
secrétaire, patient.

Le lien se montre à des cabinets : tout doit avoir l'air d'un produit fini.

---

## Lancer en local

```bash
npm install
npm run dev
```

L'application démarre sur http://localhost:3000.

- `/` — le site vitrine (hero 3D, fonctionnalités, tarifs, contact)
- `/app` — le sélecteur de rôle, porte d'entrée de la démonstration
- `/app/login` — l'espace patient (identifiants ci-dessous)

**Compte patient de démonstration** : `yasmine.alaoui` / `demo1234`

---

## Deux partis pris à connaître avant de toucher au code

### La démo ne vieillit pas

Le jeu de données est écrit par rapport à une **ancre** (`SEED_ANCHOR_ISO`
dans `lib/clock.ts`, le 23 juillet 2026). Au chargement, toutes les dates sont
décalées du nombre de jours qui sépare cette ancre du jour réel.

Conséquence : « aujourd'hui » est toujours vraiment aujourd'hui, et les écarts
relatifs sont préservés pour toujours — un détartrage « il y a trois semaines »
reste à trois semaines, dans un an comme aujourd'hui.

En pratique :

- toutes les dates internes sont de l'**ISO** `AAAA-MM-JJ` ;
- à l'affichage, on passe **toujours** par `isoToLabel` / `isoToShort` /
  `isoToWeekday` / `dueLabel` (`lib/utils.ts`), qui localisent en français et
  en arabe marocain (يوليوز, غشت, شتنبر…) ;
- ne jamais afficher une date ISO brute.

### Chaque visiteur a son propre bac à sable

Supabase est en **lecture seule** (migration `demo_read_only`). Le lien étant
public, l'écriture ouverte laissait le premier visiteur abîmer la démo du
suivant — la base s'était réellement remplie de rendez-vous « CONTROLE » et de
devis en double.

Les modifications faites pendant une visite vivent donc dans l'onglet et
disparaissent au rechargement. Le bouton **« Réinitialiser la démo »** (barre
latérale) remet le cabinet à neuf en pleine présentation.

Pour rebrancher les écritures le jour où ceci devient un vrai produit :
passer `DEMO_SANDBOX` à `false` dans `components/app/DataProvider.tsx`. Tous
les appels Supabase sont déjà écrits.

---

## Où vivent les données

| Source | Contenu |
|---|---|
| Supabase | Les 10 dossiers écrits à la main — ceux qu'on ouvre en démonstration, avec leurs alertes médicales et leur histoire. |
| `BACKGROUND` (`lib/data.ts`) | 240 dossiers supplémentaires, tirés de façon déterministe, jamais stockés. Ils portent les volumes : sans eux les indicateurs affichaient 9 000 MAD de chiffre d'affaires mensuel, un chiffre auquel aucun dentiste ne croit. |

Les deux sont fusionnés dans `lib/db.ts`. Si Supabase est injoignable,
l'application retombe sur le jeu local sans rien casser.

---

## Déploiement (Vercel)

Le dépôt est connecté à GitHub. À l'import du projet sur Vercel, ajouter les
deux variables d'environnement (elles sont publiques par conception — elles
partent de toute façon dans le navigateur, et la base est protégée par RLS) :

```
NEXT_PUBLIC_SUPABASE_URL=https://wlfazonewcuhyovzfocu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_sSQS0k3qpxnOIgjok6QiKg_5wGCKAk0
```

Sans elles, l'application fonctionne quand même : elle sert le jeu de données
local et l'indicateur de la barre latérale affiche « Données locales ».

---

## Vérifications avant de pousser

```bash
npx tsc --noEmit && npx next lint && npm run build
```

Sur macOS avec iCloud, si le build échoue sur des fichiers en double :

```bash
find .next -name "* [0-9].*" -delete
```

---

## Pile technique

Next.js 14 (App Router) · React 18 · Tailwind 3 · Three.js / react-three-fiber ·
framer-motion · recharts · jsPDF · Supabase.
