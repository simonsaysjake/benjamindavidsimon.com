# benjamindavidsimon.com — "Tiny Human"

A faithful, hand-built static rebuild of Benjamin David Simon's site, migrated off Google Sites
so it can be hosted for free on **GitHub Pages**.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole site (single page) |
| `styles.css` | All styling — Lexend type, blue accents, dark feedback section |
| `assets/hero.jpg` | Baby's-eye-view hero photo (web-optimized) |
| `assets/logo.svg` | "BDS" pacifier monogram (also the favicon) |
| `CNAME` | Tells GitHub Pages to serve the site at `benjamindavidsimon.com` |
| `.nojekyll` | Disables Jekyll processing (serves files as-is) |

The "Submit feedback" section embeds the **same Google Form** as the original
(`Q2 Life and Growth Plan`), so responses keep flowing to the same place — nothing to migrate there.

## Local preview

Just open `index.html` in a browser, or run a tiny server:

```bash
cd benjamindavidsimon
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. **Create a repo** and push these files (see the publish steps the assistant can run for you).
2. In the repo: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   branch `main`, folder `/ (root)`. Save.
3. Wait ~1 minute. Your site is live at `https://<username>.github.io/<repo>/`
   (or at the custom domain below).

## Custom domain (benjamindavidsimon.com)

The site currently points at Google Sites. To repoint it at GitHub Pages:

1. In **Settings → Pages → Custom domain**, enter `benjamindavidsimon.com` and Save
   (the `CNAME` file already does this on push).
2. At your **DNS provider** (wherever the domain is registered — likely Google Domains/Squarespace
   or wherever you bought it), replace the existing Google Sites records with GitHub's:

   **Apex domain `benjamindavidsimon.com` → four A records:**
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
   (Optionally also AAAA records: `2606:50c0:8000::153` … `8003::153`.)

   **`www` subdomain → CNAME** → `<username>.github.io`

3. Back in **Settings → Pages**, tick **Enforce HTTPS** once the certificate provisions
   (can take up to an hour).

> ⚠️ DNS changes can take a few hours to propagate. Don't delete the Google Sites version
> until the GitHub Pages version is confirmed live on the domain.
