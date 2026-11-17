// Configuration de la vitrine Amparà.
// Tout ce qui est vide ('') s'affiche « À compléter » sur le site et bloque
// la publication définitive (voir `npm run check`). Ne rien inventer ici :
// seulement des informations réelles et validées par le propriétaire.

export default {
  brand: 'Amparà',

  // 'preouverture' : aucune vente, CTA « Découvrir la méthode » / « Voir l'offre ».
  // 'ouvert'       : CTA vers l'application. Refusé par `npm run check`
  //                  tant que les champs « ouverture » ci-dessous sont vides.
  status: 'preouverture',

  // Adresse publique définitive du site, sans « / » final (ex. 'https://www.exemple.fr').
  // Sert aux URL canoniques, à l'aperçu social et au sitemap.
  siteUrl: 'https://ampara-site-nu.vercel.app',

  // Adresse publique de l'application (destination de « Ouvrir Amparà »).
  appUrl: '',

  // Adresse e-mail de contact / support réellement relevée.
  contactEmail: 'cgptutilejc@gmail.com',

  // Éditeur du site (mentions légales).
  publisher: {
    name: '',        // Nom légal (personne ou société)
    legalForm: '',   // Forme de l'activité (ex. entrepreneur individuel, SAS…)
    address: '',     // Adresse de l'éditeur ou de domiciliation
    identifiers: '', // SIREN/SIRET, RCS, n° TVA… selon la situation réelle
    director: '',    // Directeur ou directrice de la publication
  },

  // Hébergeur du site (mentions légales).
  host: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis',
    // Vercel ne publie pas de numéro dans sa politique officielle : moyen de contact publié à la place.
    phone: 'aucun numéro publié par Vercel ; contact : privacy@vercel.com',
    logRetention: 'Vercel n’indique pas de durée précise ; il conserve ces données « pour la durée minimale nécessaire » à ses obligations, puis les supprime ou les anonymise',
  },

  privacy: {
    emailRetention: '3 ans à compter du dernier échange', // Durée de conservation des échanges par e-mail
  },

  // Informations nécessaires avant l'ouverture des ventes.
  offer: {
    freeScope: '',     // Contenu exact de la découverte gratuite
    aiQuota: '',       // Limite d'usage du coach IA et comportement à la limite
    taxDisplay: '',    // Mention fiscale validée pour le prix (ex. « TTC »)
    refundPolicy: '',  // Modalités de rétractation / remboursement validées
  },

  // Passer à true uniquement après relecture des textes par le propriétaire
  // (et, si besoin, un conseil juridique).
  legalValidated: false,

  // Captures réelles de l'application, à déposer dans public/captures/.
  // Exemple : { src: '/captures/parcours.webp', alt: 'Le parcours en escales', caption: 'Parcours' }
  screenshots: [],

  lastUpdated: '17 novembre 2026',
};
