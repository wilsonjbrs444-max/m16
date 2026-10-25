# M16 IT – Étape 1 : base de données, connexion, administration des articles

## 1. Créer la base (Supabase, gratuit)
1. Crée un compte sur supabase.com, puis « New project » (note le mot de passe de la base).
2. Menu **SQL Editor** > New query > colle tout le contenu de `supabase/schema.sql` > **Run**.
3. Menu **Authentication > Providers > Email** : pendant les tests, désactive « Confirm email » pour te connecter tout de suite.
4. Menu **Project Settings > API** : copie le **Project URL** et la clé **anon public**.

## 2. Lancer le site chez toi
```
cp .env.example .env      # puis colle l'URL et la clé anon dans .env
npm install
npm run dev
```
Ouvre l'adresse affichée (http://localhost:5173).

## 3. Devenir admin (toi seul)
1. Sur le site : **Connexion > Créer un compte** avec ton e-mail.
2. Dans Supabase > SQL Editor, exécute (remplace par ton e-mail) :
```
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'TON_EMAIL');
```
3. Reconnecte-toi : le lien **Administration** apparaît. Ajoute tes articles (photo, prix, stock, promo).
Les autres comptes restent « client » : la base refuse toute modification venant d'eux, même s'ils connaissent l'adresse /admin.

## 4. Mettre en ligne (Vercel, gratuit)
1. Mets le dossier sur GitHub, puis sur vercel.com : « Add New > Project » et choisis ton dépôt.
2. Dans « Environment Variables », ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
3. Deploy. Ne mets jamais la clé `service_role` dans le projet.
