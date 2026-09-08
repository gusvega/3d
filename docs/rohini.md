# Rohini portfolio

Published at `/rohini` within the existing 3d Next.js application. Built with the published `@gusvega/ui@1.0.0` package: Button, Link, Badge, Card, Modal, Accordion, and AccordionItem. The library stylesheet is scoped to `.rohini-site` to avoid changing the other experiments. Regenerate it with `node scripts/rohini-styles.mjs`, then format it with Prettier.

## Content preservation

Source: https://www.mrohini.com/ (retrieved September 7, 2026).

- Home, About, and all eight projects are represented across ten local pages.
- All 112 public source case-study and About paragraphs were checked against the imported content after whitespace normalization.
- All 114 linked images and PDFs are downloaded and referenced: research, diagrams, before/after screens, all original carousel slides, GIF, portrait, workspace photograph, and both résumé versions.
- The main résumé link uses the source homepage's 2021 PDF. The older PDF is linked from About.
- `data/rohini/pages.json` preserves the complete public case-study content; `projects.js` contains the rewritten project introductions.
- Original `.html` page paths beneath `/rohini` redirect to their new routes.
- `data/rohini/inventory.json` records the crawl and the original missing `img/banner-bg.jpg` reference. This unavailable background is not referenced by the new UI. Original CSS is retained as an archival asset and is not loaded.
- MCG and CueMed share a password-protected source page. Their public descriptions and project covers are preserved; access links point to the original password gate. No protected content was accessed or copied.
- Original InVision links no longer resolve to the prototypes (DNS failure or redirect to Miro). The Spitfyre Heroku demo returns 404. These original links remain for reference with a visible unavailability notice, and their saved screens remain viewable locally.

## Interaction and accessibility

Responsive project filters, mobile menu, keyboard-accessible image enlargement with Escape dismissal and focus restoration, section navigation, next-project links, About accordion, skip link, focus indicators, and reduced-motion support. Case-study images retain their full-resolution originals. Next Image optimizes display sizes; the GIF retains animation.

## Verification

`npm run build`, `npm test`, `npm run format:check`, and `npm run test:e2e`. The Rohini browser suite covers every route, mobile overflow, project filters, menu, accordion, protected links, legacy paths, modal focus, page errors, and every imported media URL. Desktop and mobile layouts were also visually inspected.
