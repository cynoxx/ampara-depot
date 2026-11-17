// `npm run check` — indique ce qui bloque la publication définitive.
// Code de sortie 1 si une information obligatoire manque.
import config from '../site.config.js';
import { missing } from './launch-check.js';

const { publication, opening } = missing(config);
const line = (items) => items.map(([k, label]) => `  - ${label}  (${k})`).join('\n');

console.log(`\nAmparà — contrôle de publication (statut : ${config.status})\n`);

if (publication.length) {
  console.log('Publication définitive BLOQUÉE. Informations manquantes :');
  console.log(line(publication));
  console.log('  → Le site reste en « noindex » et affiche « À compléter » à ces endroits.\n');
} else {
  console.log('Informations légales et de contact : complètes.\n');
}

if (opening.length) {
  console.log('Ouverture commerciale non prête. À fournir :');
  console.log(line(opening));
  console.log('');
}

let failed = publication.length > 0;
if (config.status === 'ouvert' && opening.length) {
  console.log("ERREUR : status: 'ouvert' est refusé tant que ces informations manquent.\n");
  failed = true;
}
if (config.status !== 'ouvert' && config.status !== 'preouverture') {
  console.log(`ERREUR : statut inconnu « ${config.status} ».\n`);
  failed = true;
}
process.exit(failed ? 1 : 0);
