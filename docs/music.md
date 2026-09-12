# Music has moved

The composer is now hosted at `https://gusvega.dev/music` in the personal-website repository. `/music` on this site permanently redirects to that address. No gallery card or navigation link is added.

Browser storage cannot move between origins automatically. `/music/transfer` lets users download current and saved-version project JSON from this browser's old-domain localStorage, then import those files on the new site. This recovery page does not alter or delete stored projects.

The retired `/music/sw.js` removes only the old Music offline cache and unregisters its own service worker. It keeps localStorage intact. Previously installed home-screen shortcuts should be replaced with the new URL.
