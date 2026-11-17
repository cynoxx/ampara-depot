# Amparà — site vitrine

Site statique de présentation d’Amparà (Vite, HTML/CSS/JS, île 3D three.js chargée à part).
Thème sombre « vue aérienne » : forêt profonde, panneaux en verre dépoli, accent citron ; maquette de tablette illustrée (`ile-aerienne.jpg` régénérée par `npm run images`).
Indépendant de l’application : aucun secret, aucun backend, aucun cookie, aucune requête tierce.

## Commandes

```sh
npm ci            # installer
npm run dev       # développement : http://localhost:5173
npm run build     # construit dist/ (le dossier à publier)
npm run preview   # sert dist/ sur http://localhost:4173
npm run check     # liste ce qui bloque la publication définitive (code 1 si incomplet)
npm run verify    # contrôles automatiques (preview lancé) : liens, 390/1280 px, axe, sans WebGL, mouvement réduit
npm run images    # régénère og-image.png et apple-touch-icon.png (preview lancé)
```

## Tout se règle dans `site.config.js`

- Champ vide → affiché « À compléter » sur le site, et `noindex` + `robots.txt: Disallow: /` tant qu’une
  information obligatoire manque. Le sitemap et les URL canoniques n’apparaissent qu’une fois `siteUrl` renseigné
  et les mentions complètes.
- `status: 'preouverture'` (actuel) : bandeau « aucun abonnement en vente », CTA « Découvrir la méthode » /
  « Voir l’offre », aucun lien vers un paiement.
- `status: 'ouvert'` : CTA « Démarrer mes 3 jours gratuits » / « Ouvrir Amparà » vers `appUrl`.
  `npm run check` refuse ce statut tant que `appUrl`, le périmètre gratuit, le quota IA, la mention fiscale et
  les modalités de remboursement sont vides. Ne le passer qu’une fois Stripe réellement en production.
- `screenshots` : captures réelles de l’app (déposées dans `public/captures/`) → section « Aperçu » sur l’accueil.
- `legalValidated: true` uniquement après relecture des textes légaux.

## Audio

Déposer les six fichiers `co-*.ogg` / `co-*.mp3` de l’application dans `public/audio/` : les lecteurs remplacent
alors les liens vers Wikimedia Commons (CC BY-SA 3.0, crédits déjà en place).

## Structure

```
index.html, methode/, offre/, contact/, mentions-legales/, confidentialite/, conditions/, credits/, 404.html
partials/      en-tête, pied de page, offre, FAQ (inclus à la construction)
src/main.js    navigation, apparitions, chargement différé de l’île
src/island.js  scène 3D (pause hors écran, image fixe si mouvement réduit, illustration SVG si pas de WebGL)
src/styles.css jetons de couleur, thème sombre, mise en page
public/_headers en-têtes de sécurité (CSP stricte) pour Netlify / Cloudflare Pages
scripts/       contrôle de publication, vérification, génération d’images
```

## Déploiement

`dist/` est un site statique : Cloudflare Pages ou Netlify (offres gratuites autorisant un usage commercial —
conditions à revérifier au moment du choix). Commande de build `npm run build`, dossier `dist`.
Les deux lisent `public/_headers` et servent `404.html`.
