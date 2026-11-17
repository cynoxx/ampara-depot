// Liste des informations manquantes avant publication définitive / ouverture.

const PUBLICATION = [
  ['siteUrl', 'Domaine / adresse publique du site'],
  ['contactEmail', 'Adresse e-mail de contact et de support'],
  ['publisher.name', "Nom légal de l'éditeur"],
  ['publisher.legalForm', "Forme de l'activité"],
  ['publisher.address', "Adresse de l'éditeur"],
  ['publisher.identifiers', "Identifiants de l'entreprise (SIREN/SIRET…)"],
  ['publisher.director', 'Directeur·rice de la publication'],
  ['host.name', "Nom de l'hébergeur"],
  ['host.address', "Adresse de l'hébergeur"],
  ['host.phone', "Téléphone de l'hébergeur"],
  ['host.logRetention', "Durée de conservation des journaux de l'hébergeur"],
  ['privacy.emailRetention', 'Durée de conservation des échanges par e-mail'],
];

const OPENING = [
  ['appUrl', "Adresse publique de l'application"],
  ['offer.freeScope', 'Périmètre exact de la découverte gratuite'],
  ['offer.aiQuota', 'Quota du coach IA et comportement à la limite'],
  ['offer.taxDisplay', 'Mention fiscale du prix (TTC/HT)'],
  ['offer.refundPolicy', 'Modalités de rétractation / remboursement'],
];

export const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

export function missing(config) {
  const pub = PUBLICATION.filter(([k]) => !String(get(config, k) ?? '').trim());
  const open = OPENING.filter(([k]) => !String(get(config, k) ?? '').trim());
  if (!config.legalValidated) {
    pub.push(['legalValidated', 'Relecture et validation des textes légaux par le propriétaire']);
  }
  return { publication: pub, opening: open };
}

export function publishable(config) {
  return missing(config).publication.length === 0;
}
