# RXWatcher Plugin Communication Map

This catalog contains several plugin types. Operators usually install one or
more portals, then attach backends, request providers, routers, auth providers,
and observers around those portals.

## Portal Plugins

- `continuum.ebooks` is the user-facing ebook portal. It owns the web app,
  OPDS, Kobo, KOReader, Kindle send, request state, and cache behavior.
- `continuum.audiobooks` is the user-facing audiobook portal. It owns the web
  app, playback/session state, Audiobookshelf-compatible routes, presentation
  libraries, and request state.
- `continuum.requests` is the movie/TV request portal. It owns request intake,
  quotas, admin approval, and request lifecycle state.

## Dependency Notes

Some catalog entries are not useful as standalone apps. They are backends,
routers, request providers, auth providers, or observers that attach to a
portal or to Continuum core.

### Ebook Stack

- `continuum.ebooks` is the portal for ebook browsing, OPDS/Kobo/KOReader,
  Kindle send, and ebook request workflows.
- `continuum.local-ebooks` depends on `continuum.ebooks` for user-facing
  browsing and reading. It supplies a local-library `ebook_backend.v1` and local
  ebook metadata provider.
- `continuum.bookwarehouse-ebook` depends on `continuum.ebooks` for
  user-facing browsing/request handling. It supplies a Calibre/BookWarehouse
  `ebook_backend.v1` and request provider.
- `continuum.annas-archive-downloader` depends on `continuum.ebooks` for
  request intake and status display. It is a download/request fulfillment
  provider, not a standalone library portal.
- Install at least one ebook backend with `continuum.ebooks` if users should
  browse or read content. Typical choices are `continuum.local-ebooks`,
  `continuum.bookwarehouse-ebook`, or both.

### Audiobook Stack

- `continuum.audiobooks` is the portal for audiobook browsing, playback,
  Audiobookshelf-compatible routes, and audiobook request workflows.
- `continuum.local-audiobooks` depends on `continuum.audiobooks` for
  user-facing browsing and playback. It supplies a local-library
  `audiobook_backend.v1` and local audiobook metadata provider.
- `continuum.bookwarehouse-audio` depends on `continuum.audiobooks` for
  user-facing browsing and playback. It supplies a BookWarehouse
  `audiobook_backend.v1`.
- `continuum.audiobookbay-requests` depends on `continuum.audiobooks` for
  request intake and status display. It is a request fulfillment provider, not a
  standalone audiobook portal.
- Install at least one audiobook backend with `continuum.audiobooks` if users
  should browse or play content. Typical choices are
  `continuum.local-audiobooks`, `continuum.bookwarehouse-audio`, or both.

### Movie And TV Request Stack

- `continuum.requests` is the request portal for movie and TV intake, quotas,
  approval, and lifecycle state.
- `continuum.arrouter` depends on request events from `continuum.requests`. It
  routes approved requests to one of multiple configured Radarr/Sonarr targets.
- `continuum.arrproxy` depends on request events from `continuum.requests`. It
  forwards requests to a simpler single Arr Proxy target.
- `continuum.arrouter` and `continuum.arrproxy` are alternative fulfillment
  paths for the same request workflow in most installations. Install one unless
  you intentionally split routing responsibilities.
- `continuum.notifications` can observe `continuum.requests`,
  `continuum.arrouter`, `continuum.arrproxy`, ebook, audiobook, and Continuum
  events. It is optional but depends on event-producing plugins to do useful
  work.

### Auth And Public Access

- `continuum.oidc-login` depends on Continuum core auth provider support and an
  external OIDC identity provider. It does not depend on media plugins.
- `continuum.whmcs-login` depends on Continuum core auth provider support and a
  WHMCS instance. It does not depend on media plugins.
- `continuum.guest-pass` depends on Continuum content/playback routes being
  available. It is useful alongside media portals but does not provide media by
  itself.
- `continuum.public-catalog` depends on configured Ebooks and/or Audiobooks
  installations when it needs to expose public catalog browsing links.
- `continuum.stream-dashboard` depends on Continuum playback/session state. It
  is useful only when Continuum is serving streams.

## Ebook Flow

1. Users browse or request through `continuum.ebooks`.
2. `continuum.ebooks` calls ebook backend plugins for catalog, detail, cover,
   and file access.
3. Local files come from `continuum.local-ebooks`.
4. BookWarehouse/Calibre-backed files come from
   `continuum.bookwarehouse-ebook`.
5. Download/request fulfillment can be delegated to
   `continuum.annas-archive-downloader` or another selected ebook provider.
6. Providers publish acknowledgement, status, fulfilled, or failed events back
   to `continuum.ebooks`.

## Audiobook Flow

1. Users browse, play, or request through `continuum.audiobooks`.
2. `continuum.audiobooks` calls audiobook backend plugins for catalog, detail,
   cover, and streaming operations.
3. Local files come from `continuum.local-audiobooks`.
4. BookWarehouse-backed files come from `continuum.bookwarehouse-audio`.
5. AudiobookBay request fulfillment comes from
   `continuum.audiobookbay-requests`.
6. Request providers publish queued, downloading, imported, failed, or fulfilled
   status events back to `continuum.audiobooks`.

## Movie/TV Request Flow

1. Users submit movie or TV requests through `continuum.requests`.
2. Admin approval emits request lifecycle events.
3. `continuum.arrouter` applies routing rules and sends approved requests to
   configured Radarr/Sonarr targets.
4. `continuum.arrproxy` is the simpler one-target proxy path for Radarr/Sonarr
   style automation.
5. Routers publish fulfillment status back to `continuum.requests`.
6. `continuum.notifications` can observe the same events and send outbound
   webhook/notification deliveries.

## Auth Flow

- `continuum.oidc-login` adds a generic OIDC login provider.
- `continuum.whmcs-login` adds WHMCS-backed login and optional WHMCS product or
  custom-field checks.
- Auth plugins implement `auth_provider.v1` for Continuum core. They do not
  manage media or request workflows directly.

## Public And Admin Surfaces

- `continuum.public-catalog` exposes a public catalog/advertising surface and
  can call selected Ebooks or Audiobooks installations with signed, scoped
  access.
- `continuum.guest-pass` creates temporary scoped public links.
- `continuum.stream-dashboard` reads Continuum stream/session state and exposes
  active stream, history, and map views.
- `continuum.notifications` consumes events from Continuum and plugins, applies
  rules, and retries outbound deliveries.

## Common Integration Checks

1. Confirm the source plugin and destination plugin are both installed and
   enabled.
2. Check installation IDs after reinstalling a plugin; settings often point to
   a specific installation, not only a stable plugin ID.
3. Verify database URLs use dedicated plugin schemas unless the plugin
   explicitly needs Continuum database read access.
4. Test network access from the Continuum/plugin runtime network, not from the
   operator workstation.
5. Use each plugin's `docs/setup-debug-flows.md` for setup steps, route lists,
   operational flows, and debugging notes.
