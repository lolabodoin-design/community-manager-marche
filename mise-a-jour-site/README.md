# Community manager, compté

Site individuel réalisé pour le séminaire **Séminaires métiers** (M2 Marketing Opérationnel & Digital,
IAE Clermont Auvergne — UCA). Il compte le marché du métier de **community manager** à partir des offres
d'emploi publiées en France, et se met à jour chaque matin.

## Le métier ciblé

- **Intitulé principal :** Community manager
- **Variantes rencontrées :** Animateur de communauté, Social media manager, Chargé(e) de communication digitale
- **Code ROME :** `E1101` — Animation de site multimédia
- Les intitulés réellement publiés sont recomptés à chaque collecte (page d'accueil, section 1).

## Questions posées à la donnée

1. Combien d'offres, et où : Clermont, région, France, télétravail ?
2. Quels contrats et quels salaires les employeurs affichent-ils ?
3. Quels outils et compétences reviennent le plus ? Que ne me donne pas encore la formation ?
4. Qu'est-ce qui monte dans les annonces ?
5. Qui recrute, y compris sans publier d'annonce (marché caché dans le Puy-de-Dôme) ?

## Comment les données sont produites

| Étape | Script | Sortie |
|---|---|---|
| Collecte des offres (API France Travail « Offres d'emploi v2 » : requête code ROME `E1101` + requête mots-clés « community manager ») | `scripts/fetch_offres.py` | `data/offres.json` |
| Collecte des entreprises du 63 (API Recherche d'entreprises, codes NAF 73.11Z, 73.12Z, 70.21Z) | `scripts/fetch_entreprises.py` | `data/entreprises_63.json` |
| Calculs : volumes, géographie, contrats, salaires, outils, compétences, mouvement, recruteurs, marché caché | `scripts/analyse_offres.py` | `data/analyse.json`, `data/offres_site.json`, `data/historique.json` |

La GitHub Action `.github/workflows/veille.yml` enchaîne ces trois scripts chaque jour à 5 h UTC
(ou à la demande via « Run workflow ») et enregistre les fichiers de `data/` dans le dépôt : l'historique
est donc daté et conservé. Aucun chiffre du site n'est écrit à la main : tout vient de `data/analyse.json`.

Textes rédigés par l'étudiante (position, plan, notes sur les professionnels, outils vus en formation) :
`data/contenu.json` et `data/formation.json`.

## Structure du dépôt

```
index.html, offres.html, style.css, script.js   le site (statique, GitHub Pages)
data/                                           données collectées, calculées et rédigées
scripts/                                        collecte et analyse (Python)
.github/workflows/veille.yml                    automatisation quotidienne
GUIDE_DEMARRAGE.md                              création du dépôt, de la clé API, publication
```

## Règle RGPD

- Seules des données d'**annonces** et d'**entreprises** publiques sont conservées.
- Le champ `contact` fourni par l'API France Travail (nom, e-mail, téléphone d'un recruteur) est **supprimé
  dès la collecte** : il n'est ni enregistré ni publié.
- Aucun dirigeant, aucun salarié n'est nommé ; l'API Recherche d'entreprises est utilisée sans le champ « dirigeants ».
- Les entreprises ayant fait opposition à la diffusion de leurs données (`opposition_diffusion_commerciale`,
  statut de diffusion non public) sont **exclues**.
- Le repérage de personnes sur LinkedIn est fait à la main ; **aucun nom ni coordonnée n'est publié** sur
  le site. Un contact n'est utilisé que pour une candidature, en lien avec sa fonction.
- Les clés API sont stockées dans les *secrets* GitHub, jamais dans le dépôt (`.env` est ignoré).

## Limites à garder en tête

- L'API ne renvoie que les offres **diffusées par France Travail** : les offres publiées uniquement sur
  LinkedIn, Welcome to the Jungle ou les sites d'entreprise n'y sont pas, ni les recrutements sans annonce.
- Une offre peut être republiée par plusieurs intermédiaires ; les doublons sont fusionnés par identifiant,
  pas par contenu.
- Les salaires ne sont comptés que lorsqu'ils sont affichés (souvent une minorité d'offres), convertis en brut
  mensuel ; l'alternance est traitée à part.
- Les outils et compétences sont repérés par mots-clés dans le texte : un outil cité n'est pas un outil exigé.
- La comparaison « récentes / anciennes » repose sur de petits échantillons et reste indicative.
- Le code ROME E1101 couvre aussi d'autres métiers du web ; la requête par mots-clés élargit mais ajoute du bruit.

## Lancer en local

```bash
pip install -r requirements.txt
cp .env.example .env        # puis renseigner les identifiants francetravail.io
python scripts/fetch_offres.py
python scripts/fetch_entreprises.py
python scripts/analyse_offres.py
python -m http.server 8000  # puis ouvrir http://localhost:8000
```

## Sources

- API France Travail — Offres d'emploi v2 (https://francetravail.io/data/api/offres-emploi)
- API Recherche d'entreprises — data.gouv.fr (https://recherche-entreprises.api.gouv.fr)
- Apec — étude sur l'impact de l'IA sur les métiers du commercial et du marketing (voir le site)
- MétierScope — France Travail : repère externe cité comme tel, jamais recopié
