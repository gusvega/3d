# md-pages-test

Markdown-powered test site for GitHub Pages in the `gusvega-dev` organization.

## Local Development

```sh
python3 scripts/build.py
python3 -m http.server 8080 -d _site
```

## Build

```sh
python3 scripts/build.py
```

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the Markdown site and deploys `_site` to GitHub Pages.

After the first deployment, confirm Pages is configured to use **GitHub Actions** as the source in the repository settings.

## Custom Domain Later

When a domain is ready:

1. Open repository settings.
2. Go to **Pages**.
3. Add the custom domain.
4. Create the DNS records GitHub shows for the domain.
5. Enable HTTPS after DNS verifies.
