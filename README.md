# RXWatcher Continuum Plugin Catalog

This repository is an installable Continuum plugin release catalog.

Continuum can read this URL as a remote plugin repository:

```text
https://raw.githubusercontent.com/RXWatcher/continuum-plugins/main/manifest.json
```

The catalog points to versioned GitHub release assets in this repository. Each
entry includes:

- the Continuum plugin manifest
- a Linux AMD64 binary URL
- an inline SHA-256 checksum
- a `checksums.txt` release asset for operators who want to verify downloads

The catalog manifest intentionally omits plugin config schema blocks. Continuum
decodes repository indexes with Go's standard `encoding/json` path, while full
plugin manifests are loaded from installed plugin packages.

The Continuum catalog UI currently shows capability `display_name` badges, not
these markdown docs. The first capability on each plugin therefore carries the
operator-visible dependency note, such as `Portal: Ebooks`,
`For Ebooks: Local Library`, or `For Requests: Arr Router`.

Validate catalog changes before publishing:

```sh
node scripts/validate-catalog.mjs
```

## Operator Docs

- [Catalog maintenance](docs/catalog-maintenance.md)
- [Plugin communication map](docs/plugin-communication-map.md)

## Included Plugins

- `continuum.ebooks` - ebook portal. Pair with `continuum.local-ebooks`,
  `continuum.bookwarehouse-ebook`, or another ebook backend.
- `continuum.local-ebooks` - ebook backend for `continuum.ebooks`.
- `continuum.bookwarehouse-ebook` - Calibre/BookWarehouse ebook backend and
  request provider for `continuum.ebooks`.
- `continuum.annas-archive-downloader` - ebook request/download provider for
  `continuum.ebooks`.
- `continuum.audiobooks` - audiobook portal. Pair with
  `continuum.local-audiobooks`, `continuum.bookwarehouse-audio`, or another
  audiobook backend.
- `continuum.local-audiobooks` - audiobook backend for
  `continuum.audiobooks`.
- `continuum.bookwarehouse-audio` - BookWarehouse audiobook backend for
  `continuum.audiobooks`.
- `continuum.audiobookbay-requests` - audiobook request provider for
  `continuum.audiobooks`.
- `continuum.requests` - movie/TV request portal. Pair with one fulfillment
  router such as `continuum.arrouter` or `continuum.arrproxy`.
- `continuum.arrouter` - multi-target Radarr/Sonarr request router for
  `continuum.requests`.
- `continuum.arrproxy` - single-target Arr Proxy fulfillment path for
  `continuum.requests`.
- `continuum.notifications` - optional event observer/delivery plugin for
  Continuum and plugin events.
- `continuum.oidc-login` - OIDC auth provider for Continuum login.
- `continuum.whmcs-login` - WHMCS auth provider for Continuum login.
- `continuum.guest-pass` - temporary scoped public links for Continuum content.
- `continuum.public-catalog` - public catalog surface; configure it against
  Ebooks and/or Audiobooks installations.
- `continuum.stream-dashboard` - stream/session dashboard for active Continuum
  playback.

## Installing In Continuum

1. Open Continuum admin settings.
2. Go to Plugins.
3. Add a plugin repository with the manifest URL above.
4. Refresh the plugin catalog.
5. Install the plugin you need.

The current release assets are Linux AMD64 binaries. Other platforms can be
added by publishing more `plugin-<os>-<arch>-<name>` binaries and extending the
matching `binaries` entries in `manifest.json`.

## Source Mirror

The previous source mirror has been renamed to:

```text
https://github.com/RXWatcher/continuum-plugins-source
```
