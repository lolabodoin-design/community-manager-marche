#!/usr/bin/env python3
"""
Récupère les offres d'emploi pour un métier via l'API France Travail
("Offres d'emploi v2") et écrit le résultat dans data/offres.json.

Utilisation :
    python scripts/fetch_offres.py

Identifiants nécessaires (jamais versionnés, jamais dans ce fichier) :
    FRANCE_TRAVAIL_CLIENT_ID
    FRANCE_TRAVAIL_CLIENT_SECRET
Ils viennent d'une application créée sur https://francetravail.io/
(case "Offres d'emploi v2" cochée).

En local : mettez-les dans un fichier .env (voir .env.example) à la racine
du projet, non versionné (voir .gitignore).
En GitHub Actions : mettez-les dans Settings > Secrets and variables >
Actions, avec exactement ces deux noms — le workflow .github/workflows/veille.yml
les lit automatiquement.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv n'est pas obligatoire (GitHub Actions passe les secrets
    # directement en variables d'environnement) mais pratique en local.
    pass

# --- Configuration du métier -------------------------------------------------
# Modifiez ces deux valeurs si vous ciblez un autre métier / une autre requête.
CODE_ROME = os.environ.get("CODE_ROME", "E1101")
REQUETE_LABEL = os.environ.get("REQUETE_LABEL", "community manager")

# Nombre maximum d'offres à récupérer (l'API limite à 150 par appel et
# 1150 par requête au total — voir la doc francetravail.io).
MAX_OFFRES = int(os.environ.get("MAX_OFFRES", "300"))
TAILLE_PAGE = 150

TOKEN_URL = "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire"
SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = ROOT / "data" / "offres.json"


def get_token(client_id: str, client_secret: str) -> str:
    """Récupère un jeton d'accès OAuth2 (grant_type=client_credentials)."""
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "api_offresdemploiv2 o2dsoffre",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def fetch_offres(token: str) -> list[dict]:
    """Récupère les offres pour CODE_ROME, en paginant par blocs de 150."""
    headers = {"Authorization": f"Bearer {token}"}
    offres: list[dict] = []
    debut = 0

    while len(offres) < MAX_OFFRES:
        fin = debut + TAILLE_PAGE - 1
        params = {
            "codeROME": CODE_ROME,
            "range": f"{debut}-{fin}",
            "sort": 1,  # tri par date de création décroissante
        }
        resp = requests.get(SEARCH_URL, headers=headers, params=params, timeout=30)

        # 204 = aucun résultat ; 206 = résultat partiel (pagination normale)
        if resp.status_code == 204:
            break
        if resp.status_code not in (200, 206):
            resp.raise_for_status()

        page = resp.json().get("resultats", [])
        if not page:
            break
        offres.extend(page)

        if len(page) < TAILLE_PAGE:
            break  # dernière page atteinte
        debut += TAILLE_PAGE

    return offres[:MAX_OFFRES]


def simplifier(offre: dict) -> dict:
    """Ne garde que les champs utiles à l'affichage sur le site."""
    lieu = offre.get("lieuTravail", {}) or {}
    entreprise = offre.get("entreprise", {}) or {}
    salaire = offre.get("salaire", {}) or {}
    origine = offre.get("origineOffre", {}) or {}

    return {
        "id": offre.get("id"),
        "intitule": offre.get("intitule"),
        "entreprise": entreprise.get("nom") or "Entreprise non précisée",
        "lieu": lieu.get("libelle"),
        "contrat": offre.get("typeContratLibelle"),
        "salaire": salaire.get("libelle"),
        "date_publication": (offre.get("dateCreation") or "")[:10],
        "url": origine.get("urlOrigine"),
    }


def main() -> None:
    client_id = os.environ.get("FRANCE_TRAVAIL_CLIENT_ID")
    client_secret = os.environ.get("FRANCE_TRAVAIL_CLIENT_SECRET")

    if not client_id or not client_secret:
        print(
            "Erreur : FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET "
            "doivent être définis (fichier .env en local, secret GitHub en Action).",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Authentification auprès de l'API France Travail...")
    token = get_token(client_id, client_secret)

    print(f"Récupération des offres pour le code ROME {CODE_ROME}...")
    brutes = fetch_offres(token)
    print(f"{len(brutes)} offres récupérées.")

    resultat = {
        "derniere_maj": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "requete": REQUETE_LABEL,
        "code_rome": CODE_ROME,
        "nombre_offres": len(brutes),
        "offres": [simplifier(o) for o in brutes],
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(resultat, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Écrit dans {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
