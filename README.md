# Community manager, compté

Projet réalisé dans le cadre du séminaire **Séminaires métiers** (M2 Marketing
Opérationnel & Digital, IAE Clermont Auvergne — UCA).

## Le métier ciblé

- **Intitulé principal :** Community manager
- **Variantes rencontrées dans les offres :** Animateur de communauté, Social
  media manager, Chargé(e) de communication digitale
- **Code ROME :** `E1101` — Animation de site multimédia
- **Secteur :** Communication et marketing

## Questions posées à la donnée

1. Combien d'offres pour ce métier en France, et où sont-elles concentrées ?
2. Quelle fourchette de salaire, et sur quels types de contrats ?
3. Quelles compétences et quels outils reviennent le plus dans les annonces ?

## Structure du dépôt

```
index.html                 page de présentation (missions, salaire, compétences, marché)
offres.html                liste des offres en direct (lit data/offres.json)
style.css, script.js       mise en page et affichage dynamique
data/offres.json           données collectées par le script (mis à jour par la veille)
scripts/fetch_offres.py    collecte les offres via l'API France Travail
.github/workflows/veille.yml   relance la collecte chaque matin, automatiquement
GUIDE_DEMARRAGE.md         étapes pour créer le dépôt, la clé API et publier le site
```

## Lancer la collecte en local

```bash
python -m venv .venv && source .venv/bin/activate   # optionnel
pip install -r requirements.txt
cp .env.example .env   # puis complétez avec vos identifiants francetravail.io
python scripts/fetch_offres.py
```

## Équipe

- (à compléter)

## Sources

- API France Travail — Offres d'emploi v2 (https://francetravail.io/data/api/offres-emploi)
- MétierScope — France Travail (https://candidat.francetravail.fr/metierscope/)
- APEC, WEF (Future of Jobs 2025) pour la lecture de l'évolution du métier
