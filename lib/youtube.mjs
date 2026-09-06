const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
export function parseYouTubeId(raw) {
  const value = raw.trim();
  if (ID.test(value)) return value;
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    let id;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (HOSTS.has(url.hostname)) {
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1];
    }
    return typeof id === "string" && ID.test(id) ? id : null;
  } catch {
    return null;
  }
}
