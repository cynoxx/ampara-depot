// Configuration de la vitrine Amparà.
// Tout ce qui est vide ('') s'affiche « À compléter » sur le site et bloque
// la publication définitive (voir `npm run check`). Ne rien inventer ici :
// seulement des informations réelles et validées par le propriétaire.

export default {
  brand: 'Amparà',

  // 'preouverture' : aucune vente, CTA « Découvrir la méthode » / « Voir l'offre ».
  // 'ouvert'       : CTA vers l'application. Refusé par `npm run check`
  //                  tant que les champs « ouverture » ci-dessous sont vides.
  status: 'ouvert',

  // Adresse publique définitive du site, sans « / » final (ex. 'https://www.exemple.fr').
  // Sert aux URL canoniques, à l'aperçu social et au sitemap.
  siteUrl: 'https://ampara-corsu.vercel.app',

  // Adresse publique de l'application (destination de « Ouvrir Amparà »).
  appUrl: 'https://ampara-app-virid.vercel.app',

  // Adresse e-mail de contact / support réellement relevée.
  contactEmail: 'ampara.corsu@gmail.com',

  // Éditeur du site (mentions légales).
  publisher: {
    name: 'Johan Chatelon', // Nom légal (personne ou société)
    legalForm: '',   // Forme de l'activité (ex. entrepreneur individuel, SAS…)
    address: '',     // Adresse de DOMICILIATION (pas le domicile) — voir README
    identifiers: '', // SIREN/SIRET, RCS, n° TVA… selon la situation réelle
    director: 'Johan Chatelon', // Directeur ou directrice de la publication
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
    freeScope: 'la première escale « Salutations et présentation » (5 leçons), avec son carnet de mots et ses révisions espacées ; le coach IA et les escales suivantes sont réservés à Premium', // Contenu exact de la découverte gratuite
    aiQuota: '40 échanges par jour avec le coach et les conversations IA, remis à zéro chaque jour à minuit (heure de Paris) ; à la limite, un message l’indique et les leçons, révisions et le dictionnaire restent accessibles sans limite', // Limite d'usage du coach IA
    taxDisplay: 'TTC, taxes calculées, collectées et reversées par Stripe (Link), revendeur officiel', // Mention fiscale
    mediator: '',      // Médiateur de la consommation (nom, site) — obligatoire pour vendre à des particuliers
    refundPolicy: 'Tu disposes d’un droit de rétractation de 14 jours à compter de la souscription. Pour l’exercer, il suffit d’écrire à ampara.corsu@gmail.com (aucun motif à donner) : l’abonnement est résilié et, si un paiement a déjà eu lieu, il est intégralement remboursé sous 14 jours sur le moyen de paiement utilisé. Au-delà, la résiliation prend effet à la fin de la période payée, sans remboursement au prorata.', // Modalités de rétractation / remboursement
  },

  // Passer à true uniquement après relecture des textes par le propriétaire
  // (et, si besoin, un conseil juridique).
  legalValidated: false,

  // Captures réelles de l'application, à déposer dans public/captures/.
  // Exemple : { src: '/captures/parcours.webp', alt: 'Le parcours en escales', caption: 'Parcours' }
  screenshots: [
    { src: '/captures/lecon.webp', alt: 'Leçon 1 de l’app : Bonghjornu, Bonjour, un repère de prononciation et un exemple', caption: 'Une leçon courte : le mot, un exemple, un repère de prononciation' },
    { src: '/captures/quiz.webp', alt: 'Exercice : la bonne réponse Bonghjornu est validée, avec l’explication « Bravo, bonne réponse ! »', caption: 'Un exercice qui explique la réponse' },
    { src: '/captures/variante.webp', alt: 'Bouton Variante : Cismontanu Bona notte, Pumontinu Bona notti', caption: 'Le Nord et le Sud, quand la variante est confirmée' },
    { src: '/captures/revisions.webp', alt: 'Révisions intelligentes : répétition espacée sur 1, 3, 7, 14 et 30 jours', caption: 'Des révisions qui reviennent au bon moment' },
  ],

  lastUpdated: '17 novembre 2026',
};
