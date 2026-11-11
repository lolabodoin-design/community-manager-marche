// Affiche data/analyse.json (calculé par scripts/analyse_offres.py), data/contenu.json (texte de l'étudiante)
// et data/offres_site.json (liste des offres). Aucun chiffre n'est écrit à la main dans les pages.

const $ = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n) => nf.format(n);
const fmtPct = (n) => `${String(n).replace(".", ",")} %`;
const eur = (n) => `${fmt(Math.round(n))} €`;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function fmtDate(iso) {
  if (!iso) return "date inconnue";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtMois(ym) {
  const [y, m] = ym.split("-");
  return `${MOIS[+m - 1]} ${y}`;
}

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}
const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };

async function loadJSON(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.warn("Chargement impossible :", path, err);
    return null;
  }
}

// ---------- éléments réutilisables ----------
function todo(titre, texte) {
  return el("div", { class: "todo" }, el("b", { text: `${titre} — ` }), texte);
}

function renderBars(container, rows, { cls = "" } = {}) {
  clear(container);
  if (!rows.length) { container.append(el("p", { class: "muted", text: "Pas de données pour l'instant." })); return; }
  const max = Math.max(...rows.map((r) => r.value), 1);
  for (const r of rows) {
    const fill = el("div", { class: `bar-fill ${r.cls || cls}`.trim() });
    fill.dataset.w = Math.max(2, (r.value / max) * 100).toFixed(1);
    container.append(el("div", { class: "bar-row" },
      el("div", { class: "bar-label" }, r.label, r.sub ? el("small", { text: r.sub }) : null),
      el("div", { class: "bar-track" }, fill),
      el("div", { class: "bar-value" }, r.display, r.small ? el("small", { text: ` ${r.small}` }) : null)));
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    container.querySelectorAll(".bar-fill").forEach((f) => { f.style.width = `${f.dataset.w}%`; });
  }));
}

function renderTable(container, heads, rows) {
  clear(container);
  const thead = el("thead", {}, el("tr", {}, heads.map((h) => el("th", { class: h.num ? "num" : "", text: h.label }))));
  const tbody = el("tbody", {}, rows.map((r) => el("tr", {}, r.map((cell, i) =>
    el("td", { class: heads[i].num ? "num" : "" }, cell)))));
  container.append(el("table", {}, thead, tbody));
}

const srcLine = (meta, extra = "") =>
  `${meta.canal} · requêtes : ${meta.requetes.map((r) => r.label).join(" + ")} · collecte du ${fmtDate(meta.date_donnees)}${extra}`;

// ---------- page d'accueil ----------
async function pageAccueil() {
  const [a, c] = await Promise.all([loadJSON("data/analyse.json"), loadJSON("data/contenu.json")]);
  if (!a) {
    $("kpis").append(el("div", { class: "kpi" }, el("div", { class: "kpi-label", text: "Les données ne sont pas encore calculées : lancez le workflow « Veille France Travail » sur GitHub." })));
    return;
  }
  const m = a.meta, n = m.nombre_offres;

  // hero
  const chips = $("hero-chips");
  chips.append(
    el("span", { class: "chip", text: `Mise à jour : ${fmtDate(m.date_donnees)}` }),
    el("span", { class: "chip", text: `${fmt(n)} offres analysées` }),
    el("span", { class: "chip", text: `Code ROME ${m.code_rome}` }));

  // indicateurs clés
  const alt = a.contrats.find((x) => x.contrat === "Alternance");
  const sal = a.salaires.hors_alternance;
  const kpi = (value, label, note) => el("div", { class: "kpi" },
    el("div", { class: "kpi-value", text: value }), el("div", { class: "kpi-label", text: label }),
    note ? el("div", { class: "kpi-note", text: note }) : null);
  $("kpis").append(
    kpi(fmt(n), "offres ouvertes collectées", `dont ${fmt(a.volume.publiees_7_jours)} publiées ces 7 derniers jours`),
    kpi(fmtPct(a.geographie.zones[0].pct), "dans le Puy-de-Dôme", `${fmt(a.geographie.puy_de_dome)} offre(s), dont ${fmt(a.geographie.clermont_ferrand)} à Clermont-Ferrand`),
    kpi(alt ? fmtPct(alt.pct) : "—", "en alternance", alt ? `${fmt(alt.n)} offres` : "aucune offre d'alternance détectée"),
    kpi(sal.n ? eur(sal.mediane) : "—", "salaire brut mensuel médian (hors alternance)",
      sal.n ? `sur ${fmt(sal.n)} offres chiffrées (${fmtPct(a.salaires.part_renseignee)} des offres)` : "salaire rarement affiché"));

  // le métier
  const rome = $("rome");
  const dd = (k, v) => rome.append(el("dt", { text: k }), el("dd", { text: v }));
  dd("Code ROME", m.code_rome || "—");
  dd("Libellé ROME", m.rome_libelle || "Animation de site multimédia");
  dd("Offres analysées", `${fmt(n)} (dont ${fmt(m.offres_avec_texte)} avec texte complet)`);
  dd("Période des offres", `${fmtDate(m.date_plus_ancienne)} → ${fmtDate(m.date_plus_recente)}`);
  const tags = $("intitules");
  a.intitules.slice(0, 8).forEach((t) => tags.append(el("span", { class: "tag", text: `${t.intitule} · ${t.n}` })));

  // marché : géographie
  $("src-geo").textContent = srcLine(m);
  renderBars($("geo"), a.geographie.zones.map((z) => ({
    label: z.zone.replace(" (ou département non précisé)", ""), value: z.n, display: fmtPct(z.pct), small: `· ${z.n}` })));
  // contrats
  $("src-contrats").textContent = "Catégorie déduite du type de contrat, de la nature du contrat et de l'intitulé (alternance, stage).";
  renderBars($("contrats"), a.contrats.map((x) => ({ label: x.contrat, value: x.n, display: fmtPct(x.pct), small: `· ${x.n}` })), { cls: "alt" });
  // salaires
  $("src-salaires").textContent = `${a.salaires.unite}. Calculé sur les ${fmt(a.salaires.renseigne)} offres qui affichent un salaire (${fmtPct(a.salaires.part_renseignee)}).`;
  const lignes = [];
  const ligne = (nom, s) => lignes.push([nom, String(s.n), s.n ? eur(s.mediane) : "—",
    s.n ? (s.q1 ? `${eur(s.q1)} – ${eur(s.q3)}` : "trop peu d'offres") : "—", s.n ? `${eur(s.min)} – ${eur(s.max)}` : "—"]);
  if (a.salaires.hors_alternance.n) ligne("Hors alternance (ensemble)", a.salaires.hors_alternance);
  Object.entries(a.salaires.par_contrat).forEach(([k, s]) => ligne(k, s));
  renderTable($("salaires"), [{ label: "Contrat" }, { label: "Offres", num: true }, { label: "Médiane", num: true },
    { label: "Moitié centrale", num: true }, { label: "Extrêmes", num: true }], lignes);
  const rep = a.salaires.repere_externe;
  $("repere").append(el("p", { class: "callout", style: "margin-top:1rem" },
    el("strong", { text: "Repère externe : " }),
    `${rep.source}, annonce que 80 % des offres proposent entre ${eur(rep.salaire_min)} et ${eur(rep.salaire_max)} brut par mois. `,
    sal.n ? `Notre médiane (${eur(sal.mediane)}, ${sal.n} offres) s'en approche ou s'en écarte selon l'échantillon : à lire avec prudence quand n est petit.` : ""));
  // mois
  $("src-mois").textContent = "Date de publication des offres actuellement ouvertes (pas un flux annuel).";
  const mois = Object.entries(a.volume.par_mois).slice(-8);
  renderBars($("mois"), mois.map(([k, v]) => ({ label: fmtMois(k), value: v, display: String(v) })), { cls: "ok" });
  // limites
  a.limites.forEach((l) => $("limites-liste").append(el("li", { text: l })));

  // compétences et outils
  const cp = a.competences;
  $("src-outils").textContent = `${srcLine(m)} · ${fmt(m.offres_avec_texte)} offres avec texte complet. ${cp.methode}`;
  const cats = ["Tous", ...new Set(cp.outils.map((o) => o.categorie))];
  const fBox = $("filtres-outils");
  let courant = "Tous";
  const dessinerOutils = () => {
    const rows = cp.outils.filter((o) => courant === "Tous" || o.categorie === courant).slice(0, 15).map((o) => ({
      label: o.terme, sub: o.categorie, value: o.pct, display: fmtPct(o.pct), small: `· ${o.n}`,
      cls: o.vu_en_formation === false ? "alt" : o.vu_en_formation === true ? "ok" : "" }));
    renderBars($("outils"), rows);
    $("outils").querySelectorAll(".bar-row").forEach((row, i) => {
      const o = cp.outils.filter((x) => courant === "Tous" || x.categorie === courant)[i];
      if (o && o.vu_en_formation != null) row.querySelector(".bar-label").append(
        el("span", { class: `badge ${o.vu_en_formation ? "ok" : "warn"}`, style: "margin-left:.5rem",
          text: o.vu_en_formation ? "déjà vu" : "à acquérir" }));
    });
    fBox.querySelectorAll(".filter").forEach((b) => b.classList.toggle("is-on", b.dataset.cat === courant));
  };
  cats.forEach((cat) => {
    const b = el("button", { class: "filter", type: "button", text: cat });
    b.dataset.cat = cat;
    b.addEventListener("click", () => { courant = cat; dessinerOutils(); });
    fBox.append(b);
  });
  dessinerOutils();
  const fn = $("formation-note");
  if (!cp.formation_renseignee) {
    fn.append(todo("À compléter", "indiquez dans data/formation.json les outils et compétences vus en formation : le site marquera alors ce qui est « déjà vu » ou « à acquérir »."));
  } else {
    fn.append(el("h3", { text: "Ce que la formation ne donne pas encore" }));
    const t = el("div", { class: "tags" });
    cp.a_acquerir.forEach((o) => t.append(el("span", { class: "badge warn", text: `${o.terme} · ${fmtPct(o.pct)}` })));
    fn.append(cp.a_acquerir.length ? t : el("p", { text: "Les termes les plus demandés sont tous couverts par la formation." }));
  }
  renderBars($("api-comp"), cp.api_competences.map((x) => ({ label: x.libelle, value: x.pct, display: fmtPct(x.pct), small: `· ${x.n}` })));
  renderBars($("api-qual"), cp.api_qualites.map((x) => ({ label: x.libelle, value: x.pct, display: fmtPct(x.pct), small: `· ${x.n}` })), { cls: "alt" });

  // évolution
  const mv = $("mouvement");
  const rva = a.mouvement.recent_vs_ancien, vrp = a.mouvement.vs_releve_precedent;
  const tableMv = (lignes, cols) => {
    const box = el("div", { class: "table-wrap" });
    renderTable(box, cols.heads, lignes.map(cols.row));
    return box;
  };
  if (vrp) {
    mv.append(el("p", { class: "src", text: `Comparaison avec le relevé du ${fmtDate(vrp.date_precedent)} (${vrp.n_precedent} offres), en points de pourcentage.` }),
      tableMv([...vrp.lignes.slice(0, 5), ...vrp.lignes.slice(-3)], {
        heads: [{ label: "Terme" }, { label: "Avant", num: true }, { label: "Maintenant", num: true }, { label: "Écart", num: true }],
        row: (l) => [l.terme, fmtPct(l.pct_precedent), fmtPct(l.pct_actuel), `${l.ecart > 0 ? "+" : ""}${String(l.ecart).replace(".", ",")} pt`] }));
  }
  if (rva) {
    mv.append(el("p", { class: "src", style: vrp ? "margin-top:1.2rem" : "", text: `Offres récentes (depuis le ${fmtDate(rva.seuil)}, n = ${rva.n_recent}) comparées aux plus anciennes (n = ${rva.n_ancien}).` }),
      tableMv([...rva.lignes.slice(0, 5), ...rva.lignes.slice(-3)], {
        heads: [{ label: "Terme" }, { label: "Anciennes", num: true }, { label: "Récentes", num: true }, { label: "Écart", num: true }],
        row: (l) => [l.terme, fmtPct(l.pct_ancien), fmtPct(l.pct_recent), `${l.ecart > 0 ? "+" : ""}${String(l.ecart).replace(".", ",")} pt`] }),
      el("p", { class: "src", style: "margin-top:.8rem", text: rva.avertissement }));
  }
  if (!rva && !vrp) mv.append(el("p", { text: `Premier relevé : la comparaison dans le temps apparaîtra dès qu'un relevé de plus de 14 jours sera disponible (relevés enregistrés : ${a.mouvement.nb_releves}).` }));

  const src = c && c.evolution && c.evolution.source;
  const se = $("source-emploi");
  if (src) {
    se.append(el("p", {}, el("a", { href: src.url, target: "_blank", rel: "noopener", text: src.titre })),
      el("p", { class: "src", text: src.date }),
      el("ul", { class: "quote-list" }, src.points.map((p) => el("li", { text: p }))),
      el("p", { class: "callout", style: "margin-top:1rem" }, el("strong", { text: "Limite : " }), src.limite));
  } else se.append(todo("À compléter", "ajoutez une source emploi (Apec, France Travail, WEF) dans data/contenu.json."));

  const pros = $("pros");
  ((c && c.evolution && c.evolution.professionnels) || []).forEach((p) => {
    const corps = p.points && p.points.length
      ? el("ul", { class: "quote-list" }, p.points.map((x) => el("li", { text: x })))
      : todo(p.statut === "a_venir" ? "À venir" : "À compléter",
        p.statut === "a_venir" ? "journée pas encore passée." : "notez ici ce que cette journée a changé dans votre lecture du métier (data/contenu.json).");
    pros.append(el("div", { class: "card pro" }, el("div", { class: "pro-date", text: p.date }), el("h3", { text: p.profil }), corps));
  });

  // acteurs
  const ac = a.acteurs;
  $("src-recruteurs").textContent = `${ac.n_recruteurs} employeurs identifiés ; ${ac.sans_employeur} offres sans employeur indiqué. Classement automatique, à vérifier.`;
  renderTable($("recruteurs"), [{ label: "Entreprise" }, { label: "Offres", num: true }, { label: "Type" }],
    ac.recruteurs.slice(0, 12).map((r) => [r.entreprise, String(r.n),
      el("span", { class: `badge ${r.type.startsWith("Employeur") ? "ok" : ""}`, text: r.type.startsWith("Employeur") ? "Employeur direct (présumé)" : "Intermédiaire / école" })]));
  const mc = ac.marche_cache, box = $("cache");
  if (mc) {
    $("src-cache").textContent = `${mc.source} · ${mc.filtre} · relevé du ${fmtDate(mc.date)}`;
    box.append(el("p", {}, el("strong", { text: `${fmt(mc.total)} entreprises` }), ` correspondent dans le Puy-de-Dôme ; `,
      el("strong", { text: `${fmt(mc.publient_une_offre)} (${fmtPct(mc.part_visible)})` }), " publient actuellement une offre de ce métier. Les autres recrutent, s'ils recrutent, sans annonce visible."));
    const b1 = el("div", { class: "bars", style: "margin-top:1rem" });
    box.append(b1);
    renderBars(b1, Object.entries(mc.par_effectif).map(([k, v]) => ({ label: `${k} salariés`.replace("0 salarié ou non renseigné salariés", "0 salarié ou non renseigné"), value: v, display: String(v) })), { cls: "ok" });
    const card = $("cibles");
    renderTable(card, [{ label: "Entreprise" }, { label: "Commune" }, { label: "Activité" }, { label: "Effectif" }, { label: "Annonce ?" }],
      mc.cibles.slice(0, 25).map((e) => [e.nom, e.commune, e.naf, e.effectif,
        el("span", { class: `badge ${e.publie_une_offre ? "ok" : ""}`, text: e.publie_une_offre ? "publie une offre" : "pas d'annonce" })]));
  } else {
    box.append(todo("Pas encore de données", "la collecte des entreprises du 63 se lance avec le workflow GitHub."));
    $("cibles-card").hidden = true;
  }
  const lk = $("linkedin"), li = c && c.linkedin;
  lk.append(el("strong", { text: "À la main, sur LinkedIn : " }),
    li && li.profils_reperes ? `${li.profils_reperes} profils repérés dans ces entreprises. ` : "repérage des personnes qui portent ce titre dans les entreprises ci-dessus. ",
    li ? li.note : "");

  // plan et position
  const plan = (c && c.plan || []).filter((p) => p.action && p.action.trim());
  const pl = $("plan-liste");
  if (plan.length) plan.forEach((p) => pl.append(el("li", {}, el("div", { class: "when", text: p.date }), el("strong", { text: p.action }),
    p.preuve ? el("div", { class: "proof", text: `Preuve attendue : ${p.preuve}` }) : null)));
  else pl.append(el("li", {}, todo("À compléter", "trois actions datées, dont une qui produit une preuve (data/contenu.json).")));
  const pos = c && c.position, ps = $("position");
  if (pos && pos.conclusion && pos.conclusion.trim()) {
    ps.append(el("div", { class: "position" }, el("h3", { text: "Ce que je conclus sur le métier" }), el("p", { text: pos.conclusion }),
      pos.ce_que_je_cherche ? [el("h3", { text: "Ce que je vais chercher" }), el("p", { text: pos.ce_que_je_cherche })] : null));
  } else ps.append(todo("À compléter", "votre position : ce que vous concluez sur le métier et ce que vous allez chercher cette année (data/contenu.json)."));

  // méthode
  $("requetes").append(el("ul", { class: "quote-list", style: "margin-top:.6rem" }, m.requetes.map((r) =>
    el("li", { text: `${r.label} : ${r.ok === false ? "échec (non bloquant)" : `${fmt(r.recuperees ?? n)} offres`}${r.total_api ? ` sur ${fmt(r.total_api)} annoncées par l'API` : ""}` }))));

  // menu actif
  const liens = [...document.querySelectorAll("#nav-links a[href^='#']")];
  const obs = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) liens.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.block").forEach((s) => obs.observe(s));
}

// ---------- page des offres ----------
async function pageOffres() {
  const [site, a] = await Promise.all([loadJSON("data/offres_site.json"), loadJSON("data/analyse.json")]);
  const liste = $("liste");
  if (!site || !site.offres.length) { $("vide").hidden = false; $("vide").textContent = "Pas encore d'offres : lancez le workflow « Veille France Travail »."; return; }
  const offres = site.offres;
  if (a) $("hero-chips").append(
    el("span", { class: "chip", text: `Mise à jour : ${fmtDate(site.date_donnees)}` }),
    el("span", { class: "chip", text: `${fmt(offres.length)} offres` }));

  const contrats = [...new Set(offres.map((o) => o.contrat))].sort();
  const zones = [...new Set(offres.map((o) => o.zone))];
  contrats.forEach((c) => $("f-contrat").append(el("option", { value: c, text: c })));
  zones.forEach((z) => $("f-zone").append(el("option", { value: z, text: z.replace(" (ou département non précisé)", "") })));

  let limite = 40;
  const fold = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const rendre = () => {
    const q = fold($("q").value), c = $("f-contrat").value, z = $("f-zone").value, tt = $("f-tt").checked;
    const ok = offres.filter((o) => (!c || o.contrat === c) && (!z || o.zone === z) && (!tt || o.teletravail !== "non")
      && (!q || fold(`${o.intitule} ${o.entreprise} ${o.lieu}`).includes(q)));
    $("count").textContent = `${fmt(ok.length)} offre(s) sur ${fmt(offres.length)}`;
    $("vide").hidden = ok.length > 0;
    clear(liste);
    ok.slice(0, limite).forEach((o) => liste.append(el("article", { class: "offre" },
      el("div", { class: "offre-head" }, el("div", {}, el("h3", { text: o.intitule }), el("div", { class: "offre-co", text: `${o.entreprise} · ${o.lieu || "lieu non précisé"}` })),
        o.url ? el("a", { class: "offre-link", href: o.url, target: "_blank", rel: "noopener", text: "Voir l'offre →" }) : null),
      el("div", { class: "offre-meta" },
        el("span", { class: "badge", text: o.contrat }),
        o.salaire && o.salaire_mensuel ? el("span", { class: "badge ok", text: `${eur(o.salaire_mensuel[0])}${o.salaire_mensuel[1] !== o.salaire_mensuel[0] ? ` – ${eur(o.salaire_mensuel[1])}` : ""} / mois` }) : null,
        o.teletravail === "complet" ? el("span", { class: "badge ok", text: "100 % télétravail" }) : o.teletravail === "mentionné" ? el("span", { class: "badge", text: "télétravail mentionné" }) : null,
        o.date ? el("span", { class: "badge", text: `publiée le ${fmtDate(o.date)}` }) : null,
        o.outils.map((t) => el("span", { class: "tag", text: t }))))));
    if (ok.length > limite) {
      const more = el("button", { class: "filter", type: "button", text: `Afficher plus (${ok.length - limite})` });
      more.addEventListener("click", () => { limite += 40; rendre(); });
      liste.append(el("div", { style: "text-align:center" }, more));
    }
  };
  ["q", "f-contrat", "f-zone", "f-tt"].forEach((id) => $(id).addEventListener("input", () => { limite = 40; rendre(); }));
  rendre();
}

if ($("kpis")) pageAccueil();
if ($("liste")) pageOffres();
