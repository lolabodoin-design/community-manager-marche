// Charge data/offres.json (écrit par scripts/fetch_offres.py, mis à jour par la GitHub Action)
// et l'affiche sur index.html (bandeau "dernière mise à jour") et offres.html (liste des offres).

async function chargerOffres() {
  try {
    const res = await fetch("data/offres.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data/offres.json introuvable");
    return await res.json();
  } catch (err) {
    console.warn("Impossible de charger data/offres.json :", err);
    return null;
  }
}

function formatDate(iso) {
  if (!iso) return "jamais encore lancée";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

(async function init() {
  const data = await chargerOffres();

  // Bandeau sur index.html
  const majEl = document.getElementById("derniere-maj");
  if (majEl) {
    if (data && data.derniere_maj) {
      majEl.textContent = `${formatDate(data.derniere_maj)} · requête « ${data.requete || "community manager"} » · ${data.nombre_offres ?? (data.offres ? data.offres.length : 0)} offres`;
    } else {
      majEl.textContent = "à venir — lancez la collecte (voir GUIDE_DEMARRAGE.md)";
    }
  }

  // Liste sur offres.html
  const listEl = document.getElementById("offres-list");
  const bannerEl = document.getElementById("meta-banner");
  const emptyEl = document.getElementById("offres-empty");
  if (!listEl) return;

  if (!data || !Array.isArray(data.offres) || data.offres.length === 0) {
    if (bannerEl) bannerEl.remove();
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (bannerEl) {
    bannerEl.textContent = `Dernière mise à jour : ${formatDate(data.derniere_maj)} · requête « ${data.requete || "community manager"} » · code ROME ${data.code_rome || "E1101"} · ${data.nombre_offres ?? data.offres.length} offres`;
  }

  const frag = document.createDocumentFragment();
  for (const offre of data.offres) {
    const card = document.createElement("article");
    card.className = "offre-card";

    const title = document.createElement("p");
    title.className = "offre-title";
    title.textContent = offre.intitule || "Offre sans titre";
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "offre-meta";
    const bits = [
      offre.entreprise,
      offre.lieu,
      offre.contrat,
      offre.salaire,
      offre.date_publication ? `publiée le ${offre.date_publication}` : null,
    ].filter(Boolean);
    meta.textContent = bits.join(" · ");
    card.appendChild(meta);

    if (offre.url) {
      const link = document.createElement("a");
      link.className = "offre-link";
      link.href = offre.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Voir l'offre →";
      card.appendChild(link);
    }

    frag.appendChild(card);
  }
  listEl.appendChild(frag);
})();
