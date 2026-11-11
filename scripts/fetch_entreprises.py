#!/usr/bin/env python3
"""
« Marché caché » : liste les entreprises du Puy-de-Dôme (63) dont l'activité
correspond au métier (agences de publicité, régie, conseil en communication),
via l'API publique « Recherche d'entreprises » (data.gouv.fr, sans clé).

Écrit data/entreprises_63.json.

Garde-fous RGPD :
  - on ne garde que des données d'entreprises (nom, commune, activité, taille) ;
  - AUCUN dirigeant, aucun contact nominatif, aucune adresse précise ;
  - les entreprises qui ont exercé leur droit d'opposition à la diffusion
    commerciale (opposition_diffusion_commerciale) sont exclues.
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

DEPARTEMENT = os.environ.get("DEPARTEMENT", "63")
URL = "https://recherche-entreprises.api.gouv.fr/search"
NAF = {
    "73.11Z": "Agences de publicité",
    "73.12Z": "Régie publicitaire de médias",
    "70.21Z": "Conseil en relations publiques et communication",
}
PAR_PAGE = 25
PAGES_MAX = 20

# Tranches d'effectif INSEE -> (libellé, rang, groupe)
EFFECTIF = {
    "00": ("0 salarié", 0), "01": ("1 à 2", 1), "02": ("3 à 5", 2), "03": ("6 à 9", 3),
    "11": ("10 à 19", 4), "12": ("20 à 49", 5), "21": ("50 à 99", 6), "22": ("100 à 199", 7),
    "31": ("200 à 249", 8), "32": ("250 à 499", 9), "41": ("500 à 999", 10),
    "42": ("1 000 à 1 999", 11), "51": ("2 000 à 4 999", 12), "52": ("5 000 à 9 999", 13),
    "53": ("10 000 et plus", 14),
}


def groupe(rang: int) -> str:
    if rang <= 0:
        return "0 salarié ou non renseigné"
    if rang <= 3:
        return "1 à 9"
    if rang <= 5:
        return "10 à 49"
    if rang <= 8:
        return "50 à 249"
    return "250 et plus"


def main() -> None:
    out_file = Path(__file__).resolve().parent.parent / "data" / "entreprises_63.json"
    vues: dict[str, dict] = {}
    exclus = 0
    for naf, libelle in NAF.items():
        for page in range(1, PAGES_MAX + 1):
            params = {"activite_principale": naf, "departement": DEPARTEMENT,
                      "etat_administratif": "A", "per_page": PAR_PAGE, "page": page}
            for essai in range(3):  # 429 = trop de requêtes : on attend puis on réessaie
                resp = requests.get(URL, params=params, timeout=30)
                if resp.status_code != 429:
                    break
                time.sleep(2 * (essai + 1))
            resp.raise_for_status()
            data = resp.json()
            for e in data.get("results", []):
                if e.get("opposition_diffusion_commerciale") or e.get("statut_diffusion") not in (None, "O"):
                    exclus += 1
                    continue
                siege = e.get("siege") or {}
                code = str(e.get("tranche_effectif_salarie") or "")
                lib, rang = EFFECTIF.get(code, ("non renseigné", 0))
                vues[e["siren"]] = {
                    "siren": e["siren"],
                    "nom": e.get("nom_raison_sociale") or e.get("nom_complet"),
                    "naf": naf, "naf_libelle": libelle,
                    "commune": siege.get("libelle_commune"), "code_postal": siege.get("code_postal"),
                    "effectif_libelle": lib, "effectif_rang": rang, "effectif_groupe": groupe(rang),
                    "categorie": e.get("categorie_entreprise"),
                    "date_creation": e.get("date_creation"),
                }
            if page >= (data.get("total_pages") or 1):
                break
            time.sleep(0.25)  # l'API tolère ~7 appels/seconde
        print(f"{naf} {libelle} : cumul {len(vues)} entreprises")

    entreprises = sorted(vues.values(), key=lambda e: (-e["effectif_rang"], e["nom"] or ""))
    out_file.write_text(json.dumps({
        "date": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "API Recherche d'entreprises (data.gouv.fr) — base Sirene",
        "filtre": f"département {DEPARTEMENT}, établissements actifs, codes NAF " + ", ".join(NAF),
        "exclus_opposition": exclus,
        "entreprises": entreprises,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(entreprises)} entreprises écrites ({exclus} exclues : opposition à la diffusion).")


if __name__ == "__main__":
    main()
