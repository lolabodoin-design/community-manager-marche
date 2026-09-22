# Guide de démarrage — à faire par vous (comptes et clés)

Tout le contenu du site est déjà prêt dans ce dossier. Il reste des étapes
que vous devez faire vous-même : créer vos comptes et vos clés, personne
d'autre ne peut le faire à votre place. Comptez environ 20-25 minutes.

## 1. Créer votre compte GitHub (5 min)

1. Allez sur https://github.com/signup et créez un compte (avec votre email).
2. Installez **GitHub Desktop** (https://desktop.github.com/) — c'est
   l'application qui vous évite de taper des commandes : vous cliquez sur
   "Commit" et "Push" au lieu d'utiliser un terminal.

## 2. Créer le dépôt (5 min)

1. Sur github.com, cliquez sur **New repository**.
2. Nom suggéré : `community-manager-marche` (public, pour que GitHub Pages
   fonctionne gratuitement).
3. Ne cochez **pas** "Add a README" (on a déjà le nôtre).
4. Cliquez sur **Create repository**.
5. Sur la page du dépôt vide, cliquez sur **Open with GitHub Desktop** (ou
   copiez l'adresse `.git` et faites "Clone a repository" dans GitHub
   Desktop) pour le récupérer sur votre machine.
6. Copiez **tous les fichiers de ce dossier** (celui que vous avez
   téléchargé) dans le dossier que GitHub Desktop vient de créer sur votre
   machine.
7. Dans GitHub Desktop : écrivez un message de commit (ex. "Première
   version du site"), cliquez sur **Commit to main**, puis **Push origin**.

➡️ Si vous travaillez en groupe : dans **Settings > Collaborators** du
dépôt, ajoutez les comptes GitHub des autres membres pour qu'ils puissent
pousser des modifications eux aussi.

## 3. Rendu du jour (v0, avant 13h15)

Le cours demande, pour aujourd'hui avant 13h15 : l'adresse de votre dépôt
GitHub par mail à votre enseignant. Une fois l'étape 2 terminée, envoyez
simplement le lien de la page du dépôt (ex.
`https://github.com/votre-pseudo/community-manager-marche`). Les étapes 4 à
6 ci-dessous (API, automatisation, mise en ligne) peuvent se faire après si
le temps manque — elles ne sont pas nécessaires pour ce premier rendu.

## 4. Créer votre clé d'accès à l'API France Travail (5 min)

1. Allez sur https://francetravail.io/ et créez un compte.
2. Une fois connecté(e), créez une **application** (bouton généralement
   appelé "Mes applications" puis "Créer une application").
3. Dans la liste des API proposées, cochez **"Offres d'emploi v2"**.
4. Une fois l'application créée, notez l'**identifiant client** et la
   **clé secrète** affichés — vous ne pourrez revoir la clé secrète
   qu'une fois, notez-la tout de suite dans un endroit sûr (gestionnaire de
   mots de passe, par exemple).

⚠️ Ces identifiants ne doivent **jamais** être écrits dans un fichier que
vous envoyez sur GitHub. Le projet est déjà configuré pour les garder hors
du dépôt (fichier `.env`, ignoré par `.gitignore`, et "secrets" GitHub
pour l'automatisation).

## 5. Brancher la clé sur GitHub (pour que la veille tourne toute seule)

1. Sur la page de votre dépôt GitHub, allez dans **Settings > Secrets and
   variables > Actions**.
2. Cliquez sur **New repository secret**, nommez-le exactement
   `FRANCE_TRAVAIL_CLIENT_ID`, collez votre identifiant client, sauvegardez.
3. Refaites la même chose avec un secret nommé exactement
   `FRANCE_TRAVAIL_CLIENT_SECRET`, avec votre clé secrète.
4. Allez dans l'onglet **Actions** du dépôt, cliquez sur le workflow
   **"Veille France Travail"**, puis **Run workflow** pour le lancer une
   première fois manuellement.
5. Attendez une minute, rafraîchissez : si tout va bien, un nouveau commit
   apparaît avec les offres dans `data/offres.json`. En cas d'erreur, l'onglet
   Actions affiche le message — souvent une clé mal copiée.

Ensuite, ce workflow se relance **automatiquement chaque matin** : vous
n'avez plus rien à faire.

## 6. Mettre le site en ligne avec GitHub Pages (2 min)

1. Sur le dépôt, allez dans **Settings > Pages**.
2. Dans "Build and deployment" → Source, choisissez **Deploy from a
   branch**.
3. Branche : `main`, dossier : `/ (root)`. Enregistrez.
4. Après une ou deux minutes, l'adresse de votre site apparaît en haut de
   cette page, du type :
   `https://votre-pseudo.github.io/community-manager-marche/`

C'est cette adresse que vous rendrez le **19/11 avant 13h** (rendu final).

## En résumé, ce qui vous revient

- [ ] Compte GitHub + GitHub Desktop installé
- [ ] Dépôt créé, fichiers poussés → **adresse envoyée par mail avant 13h15**
- [ ] Compte francetravail.io + application créée (identifiant + clé)
- [ ] Les deux secrets ajoutés sur GitHub, workflow lancé une première fois
- [ ] GitHub Pages activé, adresse du site notée pour le 19/11

Si un mot de passe ou une clé refuse de rentrer, ou qu'un message d'erreur
apparaît quelque part, montrez-le-moi (capture d'écran ou copier-coller du
texte) et on avance ensemble.
